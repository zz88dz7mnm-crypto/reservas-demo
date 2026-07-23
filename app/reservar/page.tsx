"use client";

import { useEffect, useState } from "react";

type Servicio = { id: number; nombre: string; duracion: number; precio: number | null };
type Hueco = { hora_inicio: string; hora_fin: string };
type Peluquero = { id: number; nombre: string; foto_url: string | null };
type PeluqueroOpcion = { id: number | null; nombre: string };

const DIAS_CAB = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DIAS_LARGO = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_MIN = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatFechaLarga(iso: string) {
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  return `${DIAS_LARGO[dt.getDay()]} ${d} de ${MESES_MIN[m-1]}`;
}

function agruparHuecos(huecos: Hueco[]) {
  return {
    manana: huecos.filter(h => parseInt(h.hora_inicio) < 13),
    tarde: huecos.filter(h => parseInt(h.hora_inicio) >= 13),
  };
}

// --- Componente Calendario ---
function Calendario({ seleccionada, onSelect }: { seleccionada: string; onSelect: (iso: string) => void }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primerDia = new Date(anio, mes, 1);
  const offsetLunes = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas: (number | null)[] = [
    ...Array(offsetLunes).fill(null),
    ...Array.from({length: diasEnMes}, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const navMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setMes(d.getMonth());
    setAnio(d.getFullYear());
  };

  const isPasado = (dia: number) => new Date(anio, mes, dia) < hoy;
  const isMuyFuturo = (dia: number) => {
    const limite = new Date(hoy); limite.setDate(hoy.getDate() + 30);
    return new Date(anio, mes, dia) > limite;
  };

  const mesAnteriorDisponible = !(mes === hoy.getMonth() && anio === hoy.getFullYear());

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navMes(-1)}
          disabled={!mesAnteriorDisponible}
          className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 disabled:opacity-25 hover:bg-neutral-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="font-semibold text-neutral-800 text-base">{MESES[mes]} {anio}</span>
        <button
          onClick={() => navMes(1)}
          className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DIAS_CAB.map(d => <div key={d} className="text-center text-xs font-semibold text-neutral-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} />;
          const iso = toISO(new Date(anio, mes, dia));
          const pasado = isPasado(dia);
          const futuro = isMuyFuturo(dia);
          const disabled = pasado || futuro;
          const esHoy = iso === toISO(hoy);
          const seleccionado = iso === seleccionada;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`
                h-10 w-full rounded-xl text-sm font-medium transition-all
                ${seleccionado ? "bg-neutral-900 text-white font-bold shadow-sm" : ""}
                ${!seleccionado && esHoy ? "border-2 border-neutral-800 text-neutral-800 font-bold" : ""}
                ${!seleccionado && !esHoy && !disabled ? "text-neutral-700 hover:bg-neutral-100" : ""}
                ${disabled ? "text-neutral-300 cursor-not-allowed" : ""}
              `}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Página principal ---
export default function ReservarPage() {
  const [step, setStep] = useState(1);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null);
  const [peluqueros, setPeluqueros] = useState<Peluquero[]>([]);
  const [peluqueroSel, setPeluqueroSel] = useState<PeluqueroOpcion | null>(null);
  const [fechaSel, setFechaSel] = useState("");
  const [huecos, setHuecos] = useState<Hueco[]>([]);
  const [huecoSel, setHuecoSel] = useState<Hueco | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefonoLocal, setTelefonoLocal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservaFinal, setReservaFinal] = useState<{
    servicio: string; fecha: string; hora: string; peluquero: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/public/servicios").then(r => r.json()).then(d => setServicios(d.servicios));
    fetch("/api/public/peluqueros").then(r => r.json()).then(d => setPeluqueros(d.peluqueros ?? []));
  }, []);

  const cargarHuecos = async (fecha: string, servicio: Servicio, peluquero: PeluqueroOpcion | null) => {
    setLoading(true); setHuecos([]); setError("");
    const pParam = peluquero?.id ? `&peluquero_id=${peluquero.id}` : "";
    const r = await fetch(`/api/public/disponibilidad?fecha=${fecha}&servicio_id=${servicio.id}${pParam}`);
    const d = await r.json();
    setHuecos(d.huecos || []);
    setLoading(false);
  };

  const seleccionarFecha = async (iso: string) => {
    setFechaSel(iso);
    setHuecoSel(null);
    await cargarHuecos(iso, servicioSel!, peluqueroSel);
    setStep(4);
  };

  const confirmarReserva = async () => {
    if (!nombre.trim() || !telefonoLocal.trim()) { setError("Completá tu nombre y teléfono."); return; }
    const telefonoCompleto = `+549${telefonoLocal.replace(/\D/g,"")}`;
    setLoading(true); setError("");
    const r = await fetch("/api/public/reservar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefonoCompleto,
        servicio_id: servicioSel!.id,
        fecha: fechaSel,
        hora_inicio: huecoSel!.hora_inicio,
        peluquero_id: peluqueroSel?.id ?? null,
        observaciones: observaciones.trim() || null,
      }),
    });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(d.error || "Error al reservar");
      await cargarHuecos(fechaSel, servicioSel!, peluqueroSel);
      setHuecoSel(null); setStep(4); return;
    }
    setReservaFinal({
      servicio: servicioSel!.nombre,
      fecha: formatFechaLarga(fechaSel),
      hora: `${huecoSel!.hora_inicio} a ${d.hora_fin}`,
      peluquero: peluqueroSel?.nombre ?? "Cualquiera",
    });
    setStep(6);
  };

  // --- Pantalla de confirmación ---
  if (step === 6 && reservaFinal) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center mb-8 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Turno reservado</h1>
        <p className="text-neutral-500 text-sm mb-8">Te esperamos en el local</p>
        <div className="w-full max-w-xs bg-neutral-50 rounded-2xl p-5 text-left space-y-4 border border-neutral-100">
          {[
            { label: "Servicio", value: reservaFinal.servicio },
            { label: "Fecha", value: reservaFinal.fecha },
            { label: "Horario", value: reservaFinal.hora },
            { label: "Con", value: reservaFinal.peluquero },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-baseline">
              <span className="text-neutral-400 text-sm">{item.label}</span>
              <span className="text-neutral-900 font-semibold text-sm">{item.value}</span>
            </div>
          ))}
        </div>
        <p className="text-neutral-400 text-xs mt-8">Para cancelar o consultar, comunicate por WhatsApp.</p>
      </div>
    );
  }

  const { manana, tarde } = agruparHuecos(huecos);

  const opcionesPeluquero: PeluqueroOpcion[] = [
    { id: null, nombre: "Cualquiera" },
    ...peluqueros.map(p => ({ id: p.id, nombre: p.nombre })),
  ];

  return (
    <div className="min-h-dvh bg-white flex flex-col">

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 shrink-0 border-b border-neutral-100">
        {step > 1 && (
          <button
            onClick={() => { setStep(s => s - 1); setError(""); }}
            className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}
        <div className="flex-1">
          <p className="font-bold text-neutral-900 text-base">
            {step === 1 && "Reservar turno"}
            {step === 2 && "Elegir peluquero"}
            {step === 3 && "Elegir fecha"}
            {step === 4 && "Elegir horario"}
            {step === 5 && "Confirmar turno"}
          </p>
          {step > 1 && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {step === 2 && servicioSel?.nombre}
              {step === 3 && `${servicioSel?.nombre} · ${peluqueroSel?.nombre ?? "Cualquiera"}`}
              {step === 4 && (fechaSel ? formatFechaLarga(fechaSel) : servicioSel?.nombre)}
              {step === 5 && `${servicioSel?.nombre} · ${huecoSel?.hora_inicio}`}
            </p>
          )}
        </div>
        {/* Progress */}
        <div className="flex gap-1">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
              s === step ? "w-6 bg-neutral-900" :
              s < step ? "w-3 bg-neutral-400" :
              "w-3 bg-neutral-200"
            }`} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* PASO 1: Servicio + Ubicación */}
        {step === 1 && (
          <div className="flex-1 flex flex-col px-5 pt-6 overflow-y-auto pb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">¿Qué necesitás?</h1>
            <p className="text-neutral-400 text-sm mb-6">Elegí el servicio para continuar</p>
            <div className="space-y-2">
              {servicios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServicioSel(s); setStep(2); }}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100 active:scale-[0.99] transition-all group text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-900">{s.nombre}</div>
                    <div className="text-neutral-400 text-sm mt-0.5">
                      {s.duracion} min
                      {s.precio ? <span className="ml-2 text-neutral-600 font-medium">${s.precio.toLocaleString()}</span> : null}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>

            {/* Ubicación */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Cómo llegar</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-neutral-200">
                <iframe
                  src="https://maps.google.com/maps?q=Dean+Funes+1223,+Cordoba,+Argentina&output=embed&z=16"
                  width="100%"
                  height="200"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  title="Ubicación"
                />
                <div className="px-4 py-3 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Deán Funes 1223</p>
                    <p className="text-xs text-neutral-400">Córdoba, Argentina</p>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Dean+Funes+1223,+Cordoba,+Argentina"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Abrir Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Peluquero */}
        {step === 2 && (
          <div className="flex-1 flex flex-col px-5 pt-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">¿Con quién?</h1>
            <p className="text-neutral-400 text-sm mb-6">Podés elegir o dejarnos decidir</p>
            <div className="space-y-2">
              {opcionesPeluquero.map(op => {
                const sel = peluqueroSel?.id === op.id && (op.id !== null || peluqueroSel !== null);
                const esCualquiera = op.id === null;
                return (
                  <button
                    key={op.id ?? "cualquiera"}
                    onClick={() => { setPeluqueroSel(op); setStep(3); }}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border active:scale-[0.99] transition-all text-left ${
                      sel ? "bg-neutral-900 border-neutral-900" : "bg-neutral-50 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100"
                    }`}
                  >
                    {esCualquiera ? (
                      <div className="w-11 h-11 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zM21 12a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {peluqueros.find(p => p.id === op.id)?.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={peluqueros.find(p => p.id === op.id)!.foto_url!} alt={op.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${sel ? "text-white" : "text-neutral-900"}`}>{op.nombre}</div>
                      {esCualquiera && (
                        <div className={`text-sm mt-0.5 ${sel ? "text-neutral-300" : "text-neutral-400"}`}>El primero disponible en el horario que elijas</div>
                      )}
                    </div>
                    <svg className={`w-4 h-4 shrink-0 ${sel ? "text-neutral-400" : "text-neutral-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASO 3: Fecha */}
        {step === 3 && (
          <div className="flex-1 flex flex-col px-5 pt-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">¿Qué día?</h1>
            <p className="text-neutral-400 text-sm mb-6">Podés reservar hasta 30 días adelante</p>
            <Calendario seleccionada={fechaSel} onSelect={seleccionarFecha} />
          </div>
        )}

        {/* PASO 4: Horario */}
        {step === 4 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-6 mb-4 shrink-0">
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">¿A qué hora?</h1>
              <p className="text-neutral-400 text-sm">{fechaSel ? formatFechaLarga(fechaSel) : ""}</p>
            </div>
            {error && (
              <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm shrink-0">
                {error}
              </div>
            )}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : huecos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-5 text-center gap-4">
                <p className="text-neutral-500">No hay turnos disponibles para este día.</p>
                <button onClick={() => setStep(3)} className="text-neutral-900 font-semibold text-sm underline underline-offset-4">
                  Elegir otro día
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
                {manana.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-400 font-semibold tracking-widest uppercase mb-3">Mañana</p>
                    <div className="grid grid-cols-3 gap-2">
                      {manana.map(h => (
                        <button
                          key={h.hora_inicio}
                          onClick={() => { setHuecoSel(h); setStep(5); }}
                          className="py-3.5 px-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-95 transition-all text-center font-semibold text-neutral-800 text-sm"
                        >
                          {h.hora_inicio}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tarde.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-400 font-semibold tracking-widest uppercase mb-3">Tarde</p>
                    <div className="grid grid-cols-3 gap-2">
                      {tarde.map(h => (
                        <button
                          key={h.hora_inicio}
                          onClick={() => { setHuecoSel(h); setStep(5); }}
                          className="py-3.5 px-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-95 transition-all text-center font-semibold text-neutral-800 text-sm"
                        >
                          {h.hora_inicio}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 5: Datos + Observaciones */}
        {step === 5 && (
          <div className="flex-1 flex flex-col px-5 pt-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Tus datos</h1>
            <p className="text-neutral-400 text-sm mb-6">Para confirmar la reserva</p>

            {/* Resumen */}
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 mb-6">
              <p className="font-semibold text-neutral-900">{servicioSel?.nombre}</p>
              <p className="text-neutral-500 text-sm mt-0.5">
                {formatFechaLarga(fechaSel)} · {huecoSel?.hora_inicio}
                {peluqueroSel && peluqueroSel.id !== null && (
                  <span className="ml-2 text-neutral-400">· {peluqueroSel.nombre}</span>
                )}
              </p>
              <button onClick={() => setStep(3)} className="text-xs text-neutral-500 underline underline-offset-2 mt-2 hover:text-neutral-800">
                Cambiar fecha u horario
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">Nombre y apellido</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Juan Garcia"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">Celular</label>
                <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-xl focus-within:border-neutral-900 transition-colors overflow-hidden">
                  <span className="px-4 py-3.5 text-neutral-400 border-r border-neutral-200 shrink-0 text-sm font-mono bg-neutral-100">+54 9</span>
                  <input
                    type="tel"
                    value={telefonoLocal}
                    onChange={e => setTelefonoLocal(e.target.value)}
                    placeholder="351 706 0394"
                    className="flex-1 bg-transparent px-4 py-3.5 text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
                  Observaciones <span className="text-neutral-300 font-normal normal-case tracking-normal">(opcional)</span>
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Tengo el pelo largo, quiero que me lo dejen así pero prolijo..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors resize-none text-sm"
                />
                {observaciones.length > 400 && (
                  <p className="text-xs text-neutral-400 mt-1 text-right">{observaciones.length}/500</p>
                )}
              </div>
            </div>

            <button
              onClick={confirmarReserva}
              disabled={loading}
              className="w-full bg-neutral-900 hover:bg-neutral-700 active:scale-[0.99] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-40 text-base mb-6 shadow-sm"
            >
              {loading ? "Confirmando..." : "Confirmar turno"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
