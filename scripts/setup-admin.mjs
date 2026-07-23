#!/usr/bin/env node
/**
 * Crea el usuario admin en Supabase.
 * Correr UNA SOLA VEZ antes de deployar:
 *   node scripts/setup-admin.mjs
 *
 * Requiere que .env.local tenga NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { createInterface } from "readline";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

console.log("=== Configurar usuario admin ===\n");

const username = (await ask("Usuario: ")).trim();
const password = (await ask("Contraseña: ")).trim();
rl.close();

if (!username || password.length < 8) {
  console.error("El usuario no puede estar vacío y la contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const password_hash = bcrypt.hashSync(password, 10);

const { error } = await supabase
  .from("admins")
  .insert({ username, password_hash });

if (error) {
  if (error.code === "23505") {
    console.error(`El usuario "${username}" ya existe.`);
  } else {
    console.error("Error al crear admin:", error.message);
  }
  process.exit(1);
}

console.log(`\nAdmin "${username}" creado exitosamente.`);
console.log("Ya podés deployar en Vercel.");
