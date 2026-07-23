// Rate limiter en memoria — suficiente para un servidor único de peluquería.
// Si se escala a múltiples instancias, reemplazar con Redis.

type Entry = { count: number; resetAt: number };

const stores: Record<string, Map<string, Entry>> = {};

function getStore(name: string): Map<string, Entry> {
  if (!stores[name]) stores[name] = new Map();
  return stores[name];
}

export function rateLimit(
  store: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const map = getStore(store);
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (entry.count >= maxRequests) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true, retryAfterSec: 0 };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
