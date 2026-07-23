import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase
    .from("peluqueros")
    .select("*")
    .order("orden");
  if (error) return NextResponse.json({ error: "Error al obtener peluqueros." }, { status: 500 });
  return NextResponse.json({ peluqueros: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const { nombre, foto_url, orden } = body;
  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("peluqueros")
    .insert({ nombre: nombre.trim(), foto_url: foto_url ?? null, orden: orden ?? 0 })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "Error al crear peluquero." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const { id, nombre, foto_url, activo, orden } = body;
  if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });
  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("peluqueros")
    .update({ nombre: (nombre as string).trim(), foto_url: foto_url ?? null, activo, orden })
    .eq("id", id)
    .select("id");
  if (error) return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Peluquero no encontrado." }, { status: 404 });
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
  const { error } = await supabase.from("peluqueros").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Error al eliminar peluquero." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
