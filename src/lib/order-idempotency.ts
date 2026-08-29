const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CHECKOUT_IDEMPOTENCY_STORAGE_KEY =
  "mauskitchen-checkout-idempotency";

interface StoredCheckoutAttempt {
  key: string;
  fingerprint: string;
}

export function isValidIdempotencyKey(value: string): boolean {
  return IDEMPOTENCY_KEY_PATTERN.test(value);
}

async function hashPayload(payload: string, cryptoApi: Crypto): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

// Satu key dipakai ulang hanya untuk payload yang persis sama. Jika checkout
// berubah, key baru dibuat; sessionStorage cukup karena retry terjadi di tab ini.
export async function getCheckoutIdempotencyKey(
  payload: string,
  storage: Pick<Storage, "getItem" | "setItem">,
  cryptoApi: Crypto,
): Promise<string> {
  const fingerprint = await hashPayload(payload, cryptoApi);
  try {
    const raw = storage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<StoredCheckoutAttempt>) : null;
    if (
      stored &&
      typeof stored.key === "string" &&
      isValidIdempotencyKey(stored.key) &&
      stored.fingerprint === fingerprint
    ) {
      return stored.key;
    }
  } catch {
    // Storage rusak/diblokir: key baru tetap memberi perlindungan per submit.
  }

  const key = cryptoApi.randomUUID();
  try {
    storage.setItem(
      CHECKOUT_IDEMPOTENCY_STORAGE_KEY,
      JSON.stringify({ key, fingerprint } satisfies StoredCheckoutAttempt),
    );
  } catch {
    // Idempotency lintas retry tidak tersedia bila sessionStorage diblokir.
  }
  return key;
}
