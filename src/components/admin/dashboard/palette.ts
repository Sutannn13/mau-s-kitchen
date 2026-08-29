import type { PaymentMethod } from "@/types/order";

// Satu sumber warna chart dashboard (A9 — hilangkan duplikasi hex lintas
// komponen chart). Nilai HARUS identik dengan token brand di tailwind.config.ts
// — ubah keduanya bersamaan bila brand berubah.
export const chartPalette = {
  gold: "#C79A4B",
  brownDeep: "#3E2318",
  brown: "#5C3A24",
  creamSoft: "#FBF6F0",
  pistachio: "#8A9A3B",
} as const;

// Warna irisan donut per metode pembayaran (PaymentDonutChart + legenda).
export const paymentMethodColors: Record<PaymentMethod, string> = {
  qris: chartPalette.gold,
  transfer: chartPalette.brownDeep,
  tunai: chartPalette.pistachio,
};
