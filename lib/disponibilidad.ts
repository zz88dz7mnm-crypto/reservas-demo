import { supabase } from "./supabase";

export interface Hueco {
  hora_inicio: string;
  hora_fin: string;
}

function toMin(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

function fromMin(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export async function getHuecosDisponibles(
  fecha: string,
  duracion: number,
  peluqueroId?: number
): Promise<Hueco[]> {
  const [y, m, d] = fecha.split("-").map(Number);
  const diaSemana = new Date(y, m - 1, d).getDay();

  const [{ data: horario }, { data: peluqueros }, { data: reservas }, { data: bloqueos }] =
    await Promise.all([
      supabase.from("horarios").select("hora_inicio, hora_fin").eq("dia_semana", diaSemana).maybeSingle(),
      supabase.from("peluqueros").select("id").eq("activo", true).order("orden"),
      supabase.from("reservas").select("peluquero_id, hora_inicio, hora_fin").eq("fecha", fecha).neq("estado", "cancelada"),
      supabase.from("bloqueos").select("peluquero_id, hora_inicio, hora_fin").eq("fecha", fecha),
    ]);

  if (!horario) return [];

  const todosIds = (peluqueros ?? []).map((p) => p.id);
  if (todosIds.length === 0) return [];

  const idsAChequear = peluqueroId ? todosIds.filter((id) => id === peluqueroId) : todosIds;
  if (idsAChequear.length === 0) return [];

  const apertura = toMin(horario.hora_inicio);
  const cierre = toMin(horario.hora_fin);
  const huecos: Hueco[] = [];

  for (let inicio = apertura; inicio + duracion <= cierre; inicio += 15) {
    const fin = inicio + duracion;

    const hayLibre = idsAChequear.some((barberId) => {
      const ocupado = (reservas ?? []).some(
        (r) =>
          r.peluquero_id === barberId &&
          toMin(r.hora_inicio) < fin &&
          toMin(r.hora_fin) > inicio
      );
      if (ocupado) return false;

      const bloqueado = (bloqueos ?? []).some(
        (b) =>
          (b.peluquero_id === null || b.peluquero_id === barberId) &&
          toMin(b.hora_inicio) < fin &&
          toMin(b.hora_fin) > inicio
      );
      return !bloqueado;
    });

    if (hayLibre) huecos.push({ hora_inicio: fromMin(inicio), hora_fin: fromMin(fin) });
  }

  return huecos;
}
