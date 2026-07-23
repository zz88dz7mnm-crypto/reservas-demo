import { supabase } from "./supabase";

export interface Hueco {
  hora_inicio: string;
  hora_fin: string;
}

function generarSlots(inicio: string, fin: string, duracion: number): Hueco[] {
  const slots: Hueco[] = [];
  const [hI, mI] = inicio.split(":").map(Number);
  const [hF, mF] = fin.split(":").map(Number);
  const finMin = hF * 60 + mF;
  let cur = hI * 60 + mI;
  while (cur + duracion <= finMin) {
    const hIni = String(Math.floor(cur / 60)).padStart(2, "0");
    const mIni = String(cur % 60).padStart(2, "0");
    const curFin = cur + duracion;
    const hFin = String(Math.floor(curFin / 60)).padStart(2, "0");
    const mFin = String(curFin % 60).padStart(2, "0");
    slots.push({ hora_inicio: `${hIni}:${mIni}`, hora_fin: `${hFin}:${mFin}` });
    cur += 15;
  }
  return slots;
}

function toMin(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

function slotLibre(slot: Hueco, ocupados: { inicio: number; fin: number }[]): boolean {
  const sI = toMin(slot.hora_inicio);
  const sF = toMin(slot.hora_fin);
  return !ocupados.some(o => sI < o.fin && sF > o.inicio);
}

export async function getHuecosDisponibles(fecha: string, duracion: number): Promise<Hueco[]> {
  const [y, m, d] = fecha.split("-").map(Number);
  const diaSemana = new Date(y, m - 1, d).getDay();

  const [{ data: horario }, { data: reservas }, { data: bloqueos }] = await Promise.all([
    supabase.from("horarios").select("hora_inicio, hora_fin").eq("dia_semana", diaSemana).maybeSingle(),
    supabase.from("reservas").select("hora_inicio, hora_fin").eq("fecha", fecha).neq("estado", "cancelada"),
    supabase.from("bloqueos").select("hora_inicio, hora_fin").eq("fecha", fecha),
  ]);

  if (!horario) return [];

  const ocupados = [...(reservas ?? []), ...(bloqueos ?? [])].map(r => ({
    inicio: toMin(r.hora_inicio),
    fin: toMin(r.hora_fin),
  }));

  return generarSlots(horario.hora_inicio, horario.hora_fin, duracion).filter(s => slotLibre(s, ocupados));
}
