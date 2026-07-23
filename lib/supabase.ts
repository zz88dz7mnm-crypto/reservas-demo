import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// En API routes (server-side) usamos el service role key si está disponible.
// Esto bypasea RLS, que es correcto porque todo acceso es server-side con auth propia.
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
