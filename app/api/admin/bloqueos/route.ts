import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isISODate, isHora, isHoraFin } from "@/lib/validate";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

function validar(fecha: unknown, hora_inicio: unknown, hora_fin: unknown) {
  if (!isISODate(fecha)) return "La fecha no es válida.";
  if (!isHora(hora_inicio) || !isHora(hora_fin)) return "Formato de hora inválido.";
  if (!isHoraFin(hora_inicio, hora_fin)) return "La hora de fin debe ser mayor que la de inicio.";
  return null;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase.from("bloqueos").select("*").order("fecha").order("hora_inicio");
  if (error) return NextResponse.json({ error: "Error al obtener bloqueos." }, { status: 500 });
  return NextResponse.json({ bloqueos: data });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { fecha, hora_inicio, hora_fin, motivo } = body;
  const err = validar(fecha, hora_inicio, hora_fin);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabase
    .from("bloqueos")
    .insert({ fecha, hora_inicio, hora_fin, motivo: motivo || null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Error al crear bloqueo." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { id, fecha, hora_inicio, hora_fin, motivo } = body;
  if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });

  const err = validar(fecha, hora_inicio, hora_fin);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabase
    .from("bloqueos")
    .update({ fecha, hora_inicio, hora_fin, motivo: motivo || null })
    .eq("id", id)
    .select("id");

  if (error) return NextResponse.json({ error: "Error al actualizar bloqueo." }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Bloqueo no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });

  const { error } = await supabase.from("bloqueos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Error al eliminar bloqueo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
