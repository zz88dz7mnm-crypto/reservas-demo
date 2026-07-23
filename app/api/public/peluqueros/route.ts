import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("peluqueros")
    .select("id, nombre, foto_url")
    .eq("activo", true)
    .order("orden");

  if (error) return NextResponse.json({ error: "Error al obtener peluqueros." }, { status: 500 });
  return NextResponse.json({ peluqueros: data ?? [] });
}
