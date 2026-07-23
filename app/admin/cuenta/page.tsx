"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CuentaPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");

  useEffect(() => {
    if (session?.user?.name) setUsername(session.user.name);
  }, [session?.user?.name]);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);

    if (passwordNuevo && passwordNuevo !== passwordConfirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/cuenta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password_actual: passwordActual,
        password_nuevo: passwordNuevo || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }

    setOk(true);
    setPasswordActual("");
    setPasswordNuevo("");
    setPasswordConfirm("");
    // Si cambió el usuario, redirigir a login para volver a autenticarse
    if (username !== session?.user?.name) {
      setTimeout(() => router.push("/admin/login"), 1500);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Cuenta</h1>

      <form onSubmit={guardar} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
            minLength={3}
          />
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-700">Nueva contraseña</p>
          <p className="text-xs text-gray-400 mb-2">Dejá en blanco si no querés cambiarla.</p>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={passwordNuevo}
              onChange={e => setPasswordNuevo(e.target.value)}
              minLength={8}
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="password"
              placeholder="Repetir nueva contraseña"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Contraseña actual <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400">Requerida para confirmar cualquier cambio.</p>
          <input
            type="password"
            placeholder="Tu contraseña actual"
            value={passwordActual}
            onChange={e => setPasswordActual(e.target.value)}
            required
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}
        {ok && (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
            Cambios guardados.{username !== session?.user?.name ? " Redirigiendo al login..." : ""}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
