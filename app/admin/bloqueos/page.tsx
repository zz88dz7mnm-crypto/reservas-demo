"use client";

import { useEffect, useState } from "react";

type Bloqueo = { id: number; fecha: string; hora_inicio: string; hora_fin: string; motivo: string | null };

const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS[dt.getDay()]} ${d} ${MESES[m - 1]} ${y}`;
}

function getHoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
const hoyISO = getHoyISO();

export default function BloqueosPage() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [editando, setEditando] = useState<Bloqueo | null>(null);
  const [fecha, setFecha] = useState("");
  const [inicio, setInicio] = useState("09:00");
  const [fin, setFin] = useState("10:00");
  const [motivo, setMotivo] = useState("");

  const cargar = async () => {
    const r = await fetch("/api/admin/bloqueos");
    const d = await r.json();
    setBloqueos(d.bloqueos || []);
  };

  useEffect(() => { cargar(); }, []);

  const resetForm = () => {
    setEditando(null); setFecha(""); setInicio("09:00"); setFin("10:00"); setMotivo("");
  };

  const cargarEdicion = (b: Bloqueo) => {
    setEditando(b); setFecha(b.fecha); setInicio(b.hora_inicio); setFin(b.hora_fin); setMotivo(b.motivo || "");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await fetch("/api/admin/bloqueos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editando.id, fecha, hora_inicio: inicio, hora_fin: fin, motivo }),
      });
    } else {
      await fetch("/api/admin/bloqueos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora_inicio: inicio, hora_fin: fin, motivo }),
      });
    }
    resetForm(); cargar();
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este bloqueo?")) return;
    await fetch("/api/admin/bloqueos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    cargar();
  };

  const futuros = bloqueos.filter(b => b.fecha >= hoyISO);
  const pasados = bloqueos.filter(b => b.fecha < hoyISO);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bloqueos de horario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">{editando ? "Editar bloqueo" : "Nuevo bloqueo"}</h2>
          <form onSubmit={guardar} className="space-y-3">
            {/* Bloque unificado */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
                  min={hoyISO}
                  className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
              </div>
              <div className="border-t border-gray-100 grid grid-cols-2">
                <div className="px-4 py-2.5 border-r border-gray-100">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Desde</label>
                  <input type="time" value={inicio} onChange={e => setInicio(e.target.value)} required
                    className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                </div>
                <div className="px-4 py-2.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hasta</label>
                  <input type="time" value={fin} onChange={e => setFin(e.target.value)} required
                    className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                </div>
              </div>
              <div className="border-t border-gray-100 px-4 py-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Motivo (opcional)</label>
                <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)}
                  placeholder="Feriado, corte de luz..."
                  className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
                {editando ? "Guardar cambios" : "Crear bloqueo"}
              </button>
              {editando && (
                <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {futuros.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 px-1">Próximos</p>
              {futuros.map(b => (
                <div key={b.id} className={`rounded-2xl border p-4 mb-2 flex items-center justify-between gap-3 ${editando?.id === b.id ? "border-gray-400 bg-gray-50" : "border-orange-200 bg-orange-50"}`}>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{formatFecha(b.fecha)}</p>
                    <p className="text-gray-600 text-sm">{b.hora_inicio} — {b.hora_fin}</p>
                    {b.motivo && <p className="text-gray-400 text-xs mt-0.5">{b.motivo}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => cargarEdicion(b)} className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                      Editar
                    </button>
                    <button onClick={() => eliminar(b.id)} className="text-xs bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pasados.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2 px-1">Anteriores</p>
              {pasados.map(b => (
                <div key={b.id} className="rounded-2xl border border-gray-100 bg-white p-3 mb-2 flex items-center justify-between gap-3 opacity-50">
                  <div>
                    <p className="text-sm text-gray-600">{formatFecha(b.fecha)} · {b.hora_inicio} — {b.hora_fin}</p>
                    {b.motivo && <p className="text-xs text-gray-400">{b.motivo}</p>}
                  </div>
                  <button onClick={() => eliminar(b.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg transition-colors">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {bloqueos.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 text-sm">
              Sin bloqueos configurados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
