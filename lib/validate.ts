export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function isHora(s: unknown): s is string {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

export function isHoraFin(inicio: string, fin: string): boolean {
  const toMin = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  };
  return toMin(fin) > toMin(inicio);
}

export function isFechaFutura(iso: string): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d) >= hoy;
}

export function isFechaEnRango(iso: string, maxDias = 30): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + maxDias);
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha >= hoy && fecha <= limite;
}

const ESTADOS_VALIDOS = new Set(["confirmada", "cancelada", "asistencia_confirmada"]);
export function isEstadoValido(s: unknown): boolean {
  return typeof s === "string" && ESTADOS_VALIDOS.has(s);
}

export function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}
