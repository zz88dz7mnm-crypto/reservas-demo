import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, duracion, precio")
    .eq("activo", 1)
    .order("id");

  if (error) return NextResponse.json({ error: "Error al obtener servicios." }, { status: 500 });
  return NextResponse.json({ servicios: data });
}
