"use client";

import { useEffect, useState } from "react";

type Servicio = { id: number; nombre: string; duracion: number; precio: number | null; activo: number };

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("30");
  const [precio, setPrecio] = useState("");
  const [editando, setEditando] = useState<Servicio | null>(null);

  const cargar = async () => {
    const r = await fetch("/api/admin/servicios");
    const d = await r.json();
    setServicios(d.servicios || []);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre,
      duracion: Number(duracion),
      precio: precio ? Number(precio) : null,
    };
    if (editando) {
      await fetch("/api/admin/servicios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editando, ...payload }),
      });
      setEditando(null);
    } else {
      await fetch("/api/admin/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setNombre(""); setDuracion("30"); setPrecio(""); cargar();
  };

  const toggleActivo = async (s: Servicio) => {
    await fetch("/api/admin/servicios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, activo: s.activo === 1 ? 0 : 1 }),
    });
    cargar();
  };

  const editar = (s: Servicio) => {
    setEditando(s);
    setNombre(s.nombre);
    setDuracion(String(s.duracion));
    setPrecio(s.precio != null ? String(s.precio) : "");
  };

  const eliminar = async (s: Servicio) => {
    if (!confirm(`¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    await fetch("/api/admin/servicios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id }),
    });
    cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Servicios</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">{editando ? "Editar servicio" : "Nuevo servicio"}</h2>
          <form onSubmit={guardar} className="space-y-3">
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre del servicio</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Corte de pelo" required
                  className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none" />
              </div>
              <div className="border-t border-gray-100 grid grid-cols-2">
                <div className="px-4 py-2.5 border-r border-gray-100">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duración (min)</label>
                  <input type="number" min={5} max={240} value={duracion} onChange={e => setDuracion(e.target.value)} required
                    className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                </div>
                <div className="px-4 py-2.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio ($)</label>
                  <input type="number" min={0} value={precio} onChange={e => setPrecio(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
                {editando ? "Actualizar" : "Agregar servicio"}
              </button>
              {editando && (
                <button type="button" onClick={() => { setEditando(null); setNombre(""); setDuracion("30"); setPrecio(""); }}
                  className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {servicios.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 text-sm">Sin servicios todavía.</div>
          )}
          {servicios.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-4 ${s.activo ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
              <div className="min-w-0">
                <div className={`font-semibold text-base ${s.activo ? "text-gray-900" : "text-gray-400 line-through"}`}>{s.nombre}</div>
                <div className="text-sm text-gray-400 mt-0.5 flex gap-3">
                  <span>{s.duracion} min aprox.</span>
                  {s.precio != null && <span className="text-gray-600 font-medium">${s.precio.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => editar(s)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Editar
                </button>
                <button onClick={() => toggleActivo(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${s.activo ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  {s.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => eliminar(s)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
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
