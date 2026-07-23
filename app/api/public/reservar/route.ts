import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getHuecosDisponibles } from "@/lib/disponibilidad";
import { isISODate, isHora, isFechaEnRango } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit("reservas", ip, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
  }

  const { cliente_nombre, cliente_telefono, servicio_id, fecha, hora_inicio, peluquero_id, observaciones } = body;

  if (!cliente_nombre || !cliente_telefono || !servicio_id || !fecha || !hora_inicio) {
    return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
  }
  if (typeof cliente_nombre !== "string" || cliente_nombre.trim().length < 2 || cliente_nombre.length > 100) {
    return NextResponse.json({ error: "El nombre debe tener entre 2 y 100 caracteres." }, { status: 400 });
  }
  if (typeof cliente_telefono !== "string" || cliente_telefono.length > 20 ||
      !/^\+?\d{7,15}$/.test(cliente_telefono.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "El teléfono no es válido." }, { status: 400 });
  }
  if (!isISODate(fecha as string)) {
    return NextResponse.json({ error: "La fecha no es válida." }, { status: 400 });
  }
  if (!isHora(hora_inicio as string)) {
    return NextResponse.json({ error: "El horario no es válido." }, { status: 400 });
  }
  if (!isFechaEnRango(fecha as string, 30)) {
    return NextResponse.json({ error: "Solo se puede reservar dentro de los próximos 30 días." }, { status: 400 });
  }
  if (observaciones !== undefined && observaciones !== null) {
    if (typeof observaciones !== "string" || observaciones.length > 500) {
      return NextResponse.json({ error: "Las observaciones no pueden superar los 500 caracteres." }, { status: 400 });
    }
  }

  const pId = peluquero_id != null ? Number(peluquero_id) : null;

  const { data: servicio } = await supabase
    .from("servicios")
    .select("id, duracion")
    .eq("id", Number(servicio_id))
    .eq("activo", 1)
    .maybeSingle();

  if (!servicio) {
    return NextResponse.json({ error: "El servicio seleccionado no está disponible." }, { status: 400 });
  }

  const huecos = await getHuecosDisponibles(fecha as string, servicio.duracion, pId ?? undefined);
  const slotValido = huecos.some((h) => h.hora_inicio === hora_inicio);
  if (!slotValido) {
    return NextResponse.json({ error: "Este horario ya no está disponible. Por favor elegí otro." }, { status: 409 });
  }

  const [h, m] = (hora_inicio as string).split(":").map(Number);
  const totalMin = h * 60 + m + servicio.duracion;
  const horaFin = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

  const { data, error } = await supabase.rpc("crear_reserva", {
    p_nombre:        (cliente_nombre as string).trim(),
    p_telefono:      cliente_telefono,
    p_servicio_id:   servicio.id,
    p_fecha:         fecha,
    p_hora_inicio:   hora_inicio,
    p_hora_fin:      horaFin,
    p_peluquero_id:  pId,
    p_observaciones: (observaciones as string | null) ?? null,
  });

  if (error) {
    if (error.message.includes("HORARIO_OCUPADO") || error.message.includes("HORARIO_BLOQUEADO")) {
      return NextResponse.json({ error: "Este horario ya no está disponible. Por favor elegí otro." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reserva_id: data, hora_fin: horaFin });
}
