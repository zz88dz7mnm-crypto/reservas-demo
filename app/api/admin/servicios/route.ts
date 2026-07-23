import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

function validar(nombre: unknown, duracion: unknown, precio: unknown) {
  if (typeof nombre !== "string" || nombre.trim().length === 0) return "El nombre es obligatorio.";
  if (typeof duracion !== "number" || duracion < 5 || duracion > 240) return "La duración debe estar entre 5 y 240 minutos.";
  if (precio != null && (typeof precio !== "number" || precio < 0)) return "El precio debe ser un número positivo.";
  return null;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase.from("servicios").select("*").order("id");
  if (error) return NextResponse.json({ error: "Error al obtener servicios." }, { status: 500 });
  return NextResponse.json({ servicios: data });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { nombre, duracion, precio } = body;
  const err = validar(nombre, duracion, precio);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabase
    .from("servicios")
    .insert({ nombre: (nombre as string).trim(), duracion, precio: precio ?? null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Error al crear servicio." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { id, nombre, duracion, activo, precio } = body;
  if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });

  const err = validar(nombre, duracion, precio);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabase
    .from("servicios")
    .update({ nombre: (nombre as string).trim(), duracion, activo, precio: precio ?? null })
    .eq("id", id)
    .select("id");

  if (error) return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
