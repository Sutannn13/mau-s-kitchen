// Rate limit sederhana in-memory per IP.
// TODO: pindahkan ke penyimpanan terdistribusi (mis. Upstash Redis) saat
// deploy serverless agar berlaku lintas instance. Kebutuhan saat ini:
// 5 permintaan/IP/menit untuk POST /api/orders (docs/11 §11.9 #6).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

interface RateLimitStore {
  hits: Map<string, number[]>;
}

const globalScope = globalThis as unknown as {
  __mausKitchenRateLimit?: RateLimitStore;
};

const store: RateLimitStore = (globalScope.__mausKitchenRateLimit ??= {
  hits: new Map<string, number[]>(),
});

export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const timestamps = (store.hits.get(key) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS) {
    store.hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  store.hits.set(key, timestamps);
  return false;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
