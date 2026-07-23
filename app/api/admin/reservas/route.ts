import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isEstadoValido } from "@/lib/validate";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");

  let query = supabase
    .from("reservas")
    .select("*, servicios(nombre, duracion)")
    .order("hora_inicio");

  if (fecha) query = query.eq("fecha", fecha);
  else query = query.order("fecha", { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Error al obtener reservas." }, { status: 500 });

  const reservas = (data ?? []).map(r => ({
    ...r,
    servicio_nombre: r.servicios?.nombre,
    duracion: r.servicios?.duracion,
    servicios: undefined,
  }));

  return NextResponse.json({ reservas });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { id, estado } = body;
  if (!id || !isEstadoValido(estado)) {
    return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservas")
    .update({ estado })
    .eq("id", id)
    .select("id");

  if (error) return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
