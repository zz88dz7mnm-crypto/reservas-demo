import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getHuecosDisponibles } from "@/lib/disponibilidad";
import { isISODate } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const servicioId = searchParams.get("servicio_id");

  if (!fecha || !servicioId) {
    return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  }
  if (!isISODate(fecha)) {
    return NextResponse.json({ error: "Formato de fecha inválido. Usar YYYY-MM-DD." }, { status: 400 });
  }

  const id = Number(servicioId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "servicio_id inválido." }, { status: 400 });
  }

  const { data: servicio } = await supabase
    .from("servicios")
    .select("duracion")
    .eq("id", id)
    .eq("activo", 1)
    .maybeSingle();

  if (!servicio) return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });

  const huecos = await getHuecosDisponibles(fecha, servicio.duracion);
  return NextResponse.json({ huecos });
}
