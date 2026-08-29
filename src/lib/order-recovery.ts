import type { OrderHistoryEntry } from "@/lib/order-history-store";

// Pemulihan akses tautan privat pesanan (docs/04_BUSINESS_FLOW.md §4.4):
// dipakai sisi client saat /pesanan/[kode] atau /pembayaran/[kode] jatuh ke
// not-found karena token hilang/tidak cocok. Modul ini sengaja TIDAK
// mengimpor lib/order-access (dia memakai node:crypto, tidak boleh ikut
// bundle browser) — pola token di bawah adalah salinan TOKEN_PATTERN di
// sana; uji sinkronnya ada di __tests__/order-recovery.test.ts.
const RECOVERY_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,64}$/;

export type OrderScope = "pesanan" | "pembayaran";

export interface OrderScopeCode {
  scope: OrderScope;
  code: string;
}

// not-found.tsx tidak menerima params rute, jadi kode pesanan dibaca ulang
// dari pathname di client.
export function parseOrderScopeCode(pathname: string): OrderScopeCode | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    return null;
  }
  const [scope, encodedCode] = segments;
  if (
    (scope !== "pesanan" && scope !== "pembayaran") ||
    encodedCode === undefined
  ) {
    return null;
  }
  try {
    return { scope, code: decodeURIComponent(encodedCode) };
  } catch {
    return null;
  }
}

export function isValidRecoveryToken(token: string): boolean {
  return RECOVERY_TOKEN_PATTERN.test(token);
}

// URL privat lengkap untuk redirect pemulihan — padanan
// buildPublicOrderUrl di lib/order-access, versi client-safe.
export function buildRecoveryOrderUrl(
  scope: OrderScope,
  code: string,
  token: string,
): string {
  return `/${scope}/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`;
}

// Cari entri riwayat yang cocok untuk kode pesanan; entri dengan token
// tidak sah diabaikan supaya tidak redirect ke URL yang pasti 404.
export function findRecoveryEntry(
  entries: readonly OrderHistoryEntry[],
  code: string,
): OrderHistoryEntry | null {
  return (
    entries.find(
      (entry) => entry.code === code && isValidRecoveryToken(entry.token),
    ) ?? null
  );
}

// Alihkan otomatis hanya bila token riwayat BERBEDA dari token di URL —
// bila sama, redirect hanya akan kembali ke not-found (loop).
export function shouldRecoverRedirect(
  entry: OrderHistoryEntry,
  urlToken: string,
): boolean {
  return entry.token !== urlToken;
}
