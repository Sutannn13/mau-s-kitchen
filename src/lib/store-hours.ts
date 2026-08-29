import { siteConfig } from "@/config/site";

// Status toko berdasarkan jam operasional (docs/08 §8.9 — "Toko tutup →
// banner + pre-order"). Dipakai StoreStatusBadge (icon+text, BUKAN warna-saja)
// dan (nanti) checkout pre-order guard.

export type StoreStatus = "open" | "closed" | "unknown";

export interface StoreHours {
  openMinutes: number; // menit sejak 00:00
  closeMinutes: number; // mendukung rentang lewat tengah malam (mis. 18–01)
}

// Cocokkan pola "08.00–21.00", "8:00 - 21:00", "07.00 sampai 22.00", dst.
// Grup posisi (bukan named) — tsconfig target ES2017 belum mendukung named
// groups (TS1503). Urutan: 1=openH 2=openM 3=closeH 4=closeM.
const HOURS_PATTERN =
  /(\d{1,2})[:.](\d{2})\s*(?:[-–—]|sampai|to|ke)\s*(\d{1,2})[:.](\d{2})/i;

/**
 * Urai string jam operasional menjadi menit sejak tengah malam.
 * Mengembalikan null bila format tidak dikenali (termasuk nilai TBD) — agar UI
 * tidak mengarang status buka/tutup. (AGENTS.md #3 — dilarang mengarang jam)
 */
export function parseBusinessHours(value: string | null): StoreHours | null {
  if (!value) {
    return null;
  }
  const match = HOURS_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  // noUncheckedIndexedAccess: indeks grup bisa string | undefined.
  const openH = match[1];
  const openM = match[2];
  const closeH = match[3];
  const closeM = match[4];
  if (!openH || !openM || !closeH || !closeM) {
    return null;
  }
  const openMinutes = Number(openH) * 60 + Number(openM);
  const closeRaw = Number(closeH) * 60 + Number(closeM);
  if (
    Number.isNaN(openMinutes) ||
    Number.isNaN(closeRaw)
  ) {
    return null;
  }
  // Rentang lewat tengah malam (mis. 18.00–01.00) — pindah tutup ke hari berikut.
  const closeMinutes = closeRaw > openMinutes ? closeRaw : closeRaw + 24 * 60;
  return { openMinutes, closeMinutes };
}

/**
 * Menit sejak tengah malam pada zona Asia/Jakarta (WIB). Pakai Intl agar benar
 * walau perangkat pelanggan berada di zona waktu lain.
 */
export function jakartaMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  // minimal: fallback waktu lokal perangkat bila format tak terurai.
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return date.getHours() * 60 + date.getMinutes();
  }
  return hour * 60 + minute;
}

/**
 * Hitung status buka/tutup untuk sebuah instan. Bila jam operasional belum
 * dikonfirmasi (TBD / format tak dikenali), kembalikan "unknown" — pemanggil
 * wajib menampilkan teks konfirmasi WhatsApp, BUKAN status palsu. (AGENTS #3)
 */
export function getStoreStatus(
  now: Date = new Date(),
  hours: StoreHours | null = parseBusinessHours(siteConfig.businessHours),
): StoreStatus {
  if (!hours) {
    return "unknown";
  }
  const current = jakartaMinutes(now);
  return current >= hours.openMinutes && current < hours.closeMinutes
    ? "open"
    : "closed";
}
