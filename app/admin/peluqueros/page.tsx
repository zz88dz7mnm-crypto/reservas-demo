"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Peluquero = { id: number; nombre: string; foto_url: string | null; activo: boolean; orden: number };

export default function PeluquerosPage() {
  const [peluqueros, setPeluqueros] = useState<Peluquero[]>([]);
  const [nombre, setNombre] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [editando, setEditando] = useState<Peluquero | null>(null);

  const cargar = async () => {
    const r = await fetch("/api/admin/peluqueros");
    const d = await r.json();
    setPeluqueros(d.peluqueros || []);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { nombre, foto_url: fotoUrl || null };
    if (editando) {
      await fetch("/api/admin/peluqueros", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editando, ...payload }),
      });
      setEditando(null);
    } else {
      const maxOrden = peluqueros.length > 0 ? Math.max(...peluqueros.map(p => p.orden)) : 0;
      await fetch("/api/admin/peluqueros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, orden: maxOrden + 1 }),
      });
    }
    setNombre(""); setFotoUrl(""); cargar();
  };

  const toggleActivo = async (p: Peluquero) => {
    await fetch("/api/admin/peluqueros", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, activo: !p.activo }),
    });
    cargar();
  };

  const editar = (p: Peluquero) => {
    setEditando(p);
    setNombre(p.nombre);
    setFotoUrl(p.foto_url || "");
  };

  const eliminar = async (p: Peluquero) => {
    if (!confirm(`¿Eliminar a "${p.nombre}"? Sus turnos asignados quedarán sin peluquero.`)) return;
    await fetch("/api/admin/peluqueros", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id }),
    });
    cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Peluqueros</h1>
      <p className="text-sm text-gray-400 mb-6">Los clientes podrán elegir con quién quieren atenderse.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">{editando ? "Editar peluquero" : "Agregar peluquero"}</h2>
          <form onSubmit={guardar} className="space-y-3">
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Facundo"
                  required
                  className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none"
                />
              </div>
              <div className="border-t border-gray-100 px-4 py-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">URL de foto (opcional)</label>
                <input
                  type="url"
                  value={fotoUrl}
                  onChange={e => setFotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none"
                />
              </div>
            </div>

            {fotoUrl && (
              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                  <Image src={fotoUrl} alt="preview" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-400">Vista previa</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
                {editando ? "Actualizar" : "Agregar"}
              </button>
              {editando && (
                <button type="button" onClick={() => { setEditando(null); setNombre(""); setFotoUrl(""); }}
                  className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {peluqueros.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 text-sm">
              Sin peluqueros todavía.
            </div>
          )}
          {peluqueros.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${p.activo ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {p.foto_url ? (
                  <Image src={p.foto_url} alt={p.nombre} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-base ${p.activo ? "text-gray-900" : "text-gray-400 line-through"}`}>{p.nombre}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.activo ? "Activo" : "Inactivo"}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => editar(p)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Editar
                </button>
                <button onClick={() => toggleActivo(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${p.activo ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  {p.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => eliminar(p)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
