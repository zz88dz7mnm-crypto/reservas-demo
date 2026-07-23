import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

function extractPath(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = "/object/public/fotos/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return u.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const oldUrl = formData.get("old_url") as string | null;

  if (!file) return NextResponse.json({ error: "No se recibió archivo." }, { status: 400 });

  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG o WEBP." }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar los 2 MB." }, { status: 400 });
  }

  // Borrar foto anterior si existe
  if (oldUrl) {
    const oldPath = extractPath(oldUrl);
    if (oldPath) {
      await supabase.storage.from("fotos").remove([oldPath]);
    }
  }

  // Subir nueva foto
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `peluqueros/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage.from("fotos").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: "Error al subir la imagen." }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("fotos").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { url } = body;
  if (typeof url !== "string") return NextResponse.json({ error: "URL requerida." }, { status: 400 });

  const path = extractPath(url);
  if (path) await supabase.storage.from("fotos").remove([path]);

  return NextResponse.json({ ok: true });
}
