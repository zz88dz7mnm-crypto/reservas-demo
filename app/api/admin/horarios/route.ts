import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isHora, isHoraFin } from "@/lib/validate";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase.from("horarios").select("*").order("dia_semana");
  if (error) return NextResponse.json({ error: "Error al obtener horarios." }, { status: 500 });
  return NextResponse.json({ horarios: data });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { dia_semana, hora_inicio, hora_fin } = body;
  if (typeof dia_semana !== "number" || dia_semana < 0 || dia_semana > 6) {
    return NextResponse.json({ error: "Día de semana inválido." }, { status: 400 });
  }
  if (!isHora(hora_inicio) || !isHora(hora_fin)) {
    return NextResponse.json({ error: "Formato de hora inválido." }, { status: 400 });
  }
  if (!isHoraFin(hora_inicio, hora_fin)) {
    return NextResponse.json({ error: "La hora de cierre debe ser mayor que la de apertura." }, { status: 400 });
  }

  // Upsert: reemplaza si ya existe ese día
  const { error } = await supabase
    .from("horarios")
    .upsert({ dia_semana, hora_inicio, hora_fin }, { onConflict: "dia_semana" });

  if (error) return NextResponse.json({ error: "Error al guardar horario." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { dia_semana } = body;
  if (typeof dia_semana !== "number" || dia_semana < 0 || dia_semana > 6) {
    return NextResponse.json({ error: "Día de semana inválido." }, { status: 400 });
  }

  const { error } = await supabase.from("horarios").delete().eq("dia_semana", dia_semana);
  if (error) return NextResponse.json({ error: "Error al eliminar horario." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
