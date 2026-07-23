"use client";

import { useEffect, useState, useCallback } from "react";

type Reserva = {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  peluquero_nombre?: string | null;
  observaciones?: string | null;
};

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatHeader(iso: string) {
  const d = parseISO(iso);
  const hoy = toISO(new Date());
  const man = toISO(new Date(Date.now() + 86400000));
  if (iso === hoy) return { titulo: "Hoy", subtitulo: `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}` };
  if (iso === man) return { titulo: "Mañana", subtitulo: `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}` };
  return { titulo: DIAS[d.getDay()], subtitulo: `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` };
}

function waLink(tel: string, nombre: string, servicio: string, hora: string) {
  const t = tel.replace(/\D/g, "");
  const msg = encodeURIComponent(`Hola ${nombre}, te esperamos hoy a las ${hora} para tu ${servicio}. Confirmas que podes venir?`);
  return `https://wa.me/${t}?text=${msg}`;
}

async function setEstado(id: number, estado: string) {
  await fetch("/api/admin/reservas", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado }),
  });
}

export default function ReservasPage() {
  const [fecha, setFecha] = useState(toISO(new Date()));
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWaPanel, setShowWaPanel] = useState(false);

  const cargar = useCallback(async (f: string) => {
    setLoading(true);
    const r = await fetch(`/api/admin/reservas?fecha=${f}`);
    const d = await r.json();
    setReservas(d.reservas || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(fecha); }, [fecha, cargar]);

  const navDia = (delta: number) => {
    const d = parseISO(fecha);
    d.setDate(d.getDate() + delta);
    setFecha(toISO(d));
    setShowWaPanel(false);
  };

  const actuar = async (id: number, estado: string) => {
    if (estado === "cancelada" && !confirm("¿Cancelar este turno?")) return;
    await setEstado(id, estado);
    cargar(fecha);
  };

  const atender = async (id: number) => {
    await fetch("/api/admin/reservas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    cargar(fecha);
  };

  // Confirmadas = pendiente de asistencia o asistencia ya confirmada
  const activas = reservas.filter(r => r.estado !== "cancelada");
  const pendientes = reservas.filter(r => r.estado === "confirmada"); // sin confirmar asistencia
  const asistConfirmadas = reservas.filter(r => r.estado === "asistencia_confirmada");
  const canceladas = reservas.filter(r => r.estado === "cancelada");

  const { titulo, subtitulo } = formatHeader(fecha);

  return (
    <div className="max-w-2xl mx-auto">

      {/* Navegación de día */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navDia(-1)} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{titulo}</h1>
          <p className="text-sm text-gray-400">{subtitulo}</p>
        </div>
        <button onClick={() => navDia(1)} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
        <input
          type="date"
          value={fecha}
          onChange={e => { setFecha(e.target.value); setShowWaPanel(false); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600"
        />
      </div>

      {/* Resumen del día */}
      {activas.length > 0 && (
        <div className="flex gap-3 mb-5 text-sm">
          <div className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{activas.length}</div>
            <div className="text-gray-400 text-xs mt-0.5">turnos</div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{asistConfirmadas.length}</div>
            <div className="text-gray-400 text-xs mt-0.5">confirmados</div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{pendientes.length}</div>
            <div className="text-gray-400 text-xs mt-0.5">sin respuesta</div>
          </div>
        </div>
      )}

      {/* Panel WA — solo los que no confirmaron asistencia */}
      {pendientes.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setShowWaPanel(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-emerald-800 text-sm">Enviar recordatorio</p>
                <p className="text-xs text-emerald-600">{pendientes.length} {pendientes.length === 1 ? "cliente sin confirmar" : "clientes sin confirmar"}</p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-emerald-600 transition-transform ${showWaPanel ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>

          {showWaPanel && (
            <div className="mt-2 rounded-2xl border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200">
                <p className="text-xs text-emerald-700">&ldquo;Hola [nombre], te esperamos hoy a las [hora] para tu [servicio]. Confirmas que podes venir?&rdquo;</p>
              </div>
              {pendientes.map(r => (
                <a key={r.id} href={waLink(r.cliente_telefono, r.cliente_nombre, r.servicio_nombre, r.hora_inicio)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-white hover:bg-emerald-50 border-b border-gray-100 last:border-0 transition-colors group"
                >
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{r.cliente_nombre}</span>
                    <span className="text-gray-400 text-xs ml-2">{r.hora_inicio}</span>
                  </div>
                  <span className="text-emerald-600 text-xs font-semibold group-hover:text-emerald-700">Enviar</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de turnos */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium text-gray-500">Sin turnos este día</p>
          <p className="text-sm mt-1">Usá las flechas o el calendario para navegar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activas.map(r => <TurnoCard key={r.id} r={r} onActuar={actuar} onAtender={atender} />)}
          {canceladas.length > 0 && (
            <>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest pt-4 pb-1 px-1">Cancelados</p>
              {canceladas.map(r => <TurnoCard key={r.id} r={r} onActuar={actuar} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TurnoCard({ r, onActuar, onAtender }: { r: Reserva; onActuar: (id: number, estado: string) => void; onAtender?: (id: number) => void }) {
  const cancelada = r.estado === "cancelada";
  const asistOk = r.estado === "asistencia_confirmada";
  const [obsExpanded, setObsExpanded] = useState(false);

  function waLinkCard() {
    const t = r.cliente_telefono.replace(/\D/g, "");
    const msg = encodeURIComponent(`Hola ${r.cliente_nombre}, te esperamos hoy a las ${r.hora_inicio} para tu ${r.servicio_nombre}. Confirmas que podes venir?`);
    return `https://wa.me/${t}?text=${msg}`;
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      cancelada ? "bg-gray-50 border-gray-100 opacity-60" :
      asistOk   ? "bg-white border-emerald-200" :
                  "bg-white border-gray-200"
    }`}>

      {/* Cuerpo */}
      <div className="flex items-stretch gap-0 p-4">

        {/* Columna de hora */}
        <div className="shrink-0 flex flex-col items-center justify-start pt-0.5 w-16 mr-3">
          <span className={`text-2xl font-black tabular-nums leading-none ${cancelada ? "text-gray-300" : "text-gray-900"}`}>
            {r.hora_inicio}
          </span>
          <span className="text-[11px] text-gray-400 font-medium mt-0.5">{r.hora_fin}</span>
        </div>

        <div className={`w-px self-stretch mr-4 ${cancelada ? "bg-gray-150" : asistOk ? "bg-emerald-100" : "bg-gray-100"}`} />

        {/* Info principal */}
        <div className="flex-1 min-w-0">

          {/* Nombre del cliente — principal */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`font-bold text-[17px] leading-snug ${cancelada ? "text-gray-300 line-through" : "text-gray-900"}`}>
              {r.cliente_nombre}
            </span>
            <div className="flex gap-1.5 shrink-0">
              {asistOk && <span className="text-[11px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">Viene</span>}
              {cancelada && <span className="text-[11px] bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full font-medium">Cancelado</span>}
            </div>
          </div>

          {/* Peluquero con ícono */}
          {r.peluquero_nombre && (
            <div className={`flex items-center gap-1.5 mb-1 ${cancelada ? "opacity-40" : ""}`}>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span className="text-[15px] font-bold text-gray-600">{r.peluquero_nombre}</span>
            </div>
          )}

          {/* Servicio */}
          <p className="text-[13px] text-gray-500 mb-0.5">{r.servicio_nombre}</p>

          {/* Teléfono */}
          <p className="text-[12px] text-gray-400">{r.cliente_telefono}</p>

          {/* Observaciones */}
          {r.observaciones && (
            <>
              <button
                onClick={() => setObsExpanded(v => !v)}
                className="flex items-center gap-1 mt-2 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className={`w-3 h-3 transition-transform duration-150 ${obsExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
                Observaciones
              </button>
              {obsExpanded && (
                <p className="mt-1.5 text-[12px] text-gray-600 pl-3 border-l-2 border-gray-200 leading-relaxed">
                  {r.observaciones}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barra de acciones */}
      {!cancelada && (
        <div className={`flex items-center gap-2 px-4 py-2.5 border-t ${
          asistOk ? "border-emerald-100 bg-emerald-50/40" : "border-gray-100 bg-gray-50/60"
        }`}>

          <button
            onClick={() => onAtender?.(r.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-700 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Atendido
          </button>

          <button
            onClick={() => onActuar(r.id, asistOk ? "confirmada" : "asistencia_confirmada")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold active:scale-95 transition-all ${
              asistOk
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {asistOk ? "Confirmado" : "Confirmar"}
          </button>

          <div className="flex-1" />

          <a
            href={waLinkCard()}
            target="_blank"
            rel="noopener noreferrer"
            title="Enviar WhatsApp"
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>

          <button
            onClick={() => onActuar(r.id, "cancelada")}
            title="Cancelar turno"
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {cancelada && (
        <div className="flex items-center px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={() => onActuar(r.id, "confirmada")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-[12px] font-semibold hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Restaurar turno
          </button>
        </div>
      )}
    </div>
  );
}
