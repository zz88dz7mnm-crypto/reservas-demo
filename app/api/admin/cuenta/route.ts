import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

async function getAdminId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as Record<string, unknown> | undefined)?.id;
  return id ? Number(id) : null;
}

export async function PUT(req: NextRequest) {
  const adminId = await getAdminId();
  if (!adminId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { username, password_actual, password_nuevo } = body;

  if (typeof username !== "string" || username.trim().length < 3) {
    return NextResponse.json({ error: "El usuario debe tener al menos 3 caracteres." }, { status: 400 });
  }
  if (typeof password_actual !== "string" || !password_actual) {
    return NextResponse.json({ error: "Ingresá tu contraseña actual para confirmar." }, { status: 400 });
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("password_hash")
    .eq("id", adminId)
    .maybeSingle();

  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const passwordOk = await bcrypt.compare(password_actual, admin.password_hash);
  if (!passwordOk) return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });

  const updates: Record<string, string> = { username: username.trim() };

  if (password_nuevo) {
    if (typeof password_nuevo !== "string" || password_nuevo.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres." }, { status: 400 });
    }
    updates.password_hash = await bcrypt.hash(password_nuevo, 10);
  }

  const { error } = await supabase.from("admins").update(updates).eq("id", adminId);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ese nombre de usuario ya está en uso." }, { status: 409 });
    return NextResponse.json({ error: "Error al guardar cambios." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
