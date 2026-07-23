"use client";

import { useEffect, useState } from "react";

type Horario = { id: number; dia_semana: number; hora_inicio: string; hora_fin: string };

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [dia, setDia] = useState("1");
  const [inicio, setInicio] = useState("09:00");
  const [fin, setFin] = useState("18:00");

  const cargar = async () => {
    const r = await fetch("/api/admin/horarios");
    const d = await r.json();
    setHorarios(d.horarios || []);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/horarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dia_semana: Number(dia), hora_inicio: inicio, hora_fin: fin }),
    });
    cargar();
  };

  const eliminar = async (dia_semana: number) => {
    if (!confirm("¿Quitar el horario de este día?")) return;
    await fetch("/api/admin/horarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dia_semana }),
    });
    cargar();
  };

  const cargarEdicion = (h: Horario) => {
    setDia(String(h.dia_semana));
    setInicio(h.hora_inicio);
    setFin(h.hora_fin);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Horarios de atención</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Configurar día</h2>
          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Día de la semana</label>
              <select
                value={dia}
                onChange={e => setDia(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 bg-white"
              >
                {DIAS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Apertura</label>
                <input
                  type="time"
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cierre</label>
                <input
                  type="time"
                  value={fin}
                  onChange={e => setFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">Si el día ya tiene horario, se reemplaza automáticamente.</p>
            <button type="submit" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
              Guardar horario
            </button>
          </form>
        </div>

        {/* Lista de días */}
        <div className="space-y-2">
          {DIAS.map((nombre, i) => {
            const h = horarios.find(h => h.dia_semana === i);
            return (
              <div key={i} className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${h ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"}`}>
                <div>
                  <p className={`font-semibold text-sm ${h ? "text-gray-900" : "text-gray-400"}`}>{nombre}</p>
                  {h ? (
                    <p className="text-sm text-gray-500 mt-0.5">{h.hora_inicio} — {h.hora_fin}</p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-0.5">No trabaja</p>
                  )}
                </div>
                {h && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => cargarEdicion(h)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                      Editar
                    </button>
                    <button onClick={() => eliminar(i)} className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
