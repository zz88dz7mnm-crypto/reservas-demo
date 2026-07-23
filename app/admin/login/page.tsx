"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/admin/reservas");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "oklch(95% 0.008 55)" }}
    >
      {/* Marca */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "oklch(20% 0.005 55)" }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
            <path d="M6.5 14a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
            <path d="M9 7.5L20 3M9 16.5L20 21M9 7.5L15 12M9 16.5L15 12M15 12L20 3M15 12L20 21"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg tracking-tight" style={{ color: "oklch(18% 0.005 55)" }}>Panel</p>
          <p className="text-sm" style={{ color: "oklch(52% 0.006 55)" }}>Acceso exclusivo</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        {error && (
          <p
            className="text-sm text-center rounded-2xl px-4 py-3"
            style={{
              background: "oklch(94% 0.04 25)",
              color: "oklch(42% 0.14 25)",
              border: "1px solid oklch(85% 0.07 25)",
            }}
          >
            {error}
          </p>
        )}

        {/* Bloque unificado de inputs */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "oklch(99.5% 0.003 55)",
            boxShadow: "0 1px 3px oklch(0% 0 0 / 0.06), 0 0 0 1px oklch(0% 0 0 / 0.05)",
          }}
        >
          <div className="px-5 pt-4 pb-3">
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "oklch(52% 0.006 55)" }}
            >
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="tu usuario"
              className="w-full bg-transparent text-base focus:outline-none placeholder:opacity-30"
              style={{ color: "oklch(15% 0.005 55)" }}
            />
          </div>

          <div style={{ height: 1, background: "oklch(90% 0.005 55)", margin: "0 20px" }} />

          <div className="px-5 pt-3 pb-4">
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "oklch(52% 0.006 55)" }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full bg-transparent text-base focus:outline-none placeholder:opacity-30"
              style={{ color: "oklch(15% 0.005 55)" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-bold py-4 rounded-2xl text-base transition-opacity disabled:opacity-50"
          style={{ background: "oklch(20% 0.005 55)", color: "oklch(97% 0.003 55)" }}
        >
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
