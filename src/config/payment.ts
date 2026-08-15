// Konfigurasi pembayaran Fase 1. Lihat docs/12_PAYMENT_QRIS.md §12.5.
// Nilai `TBD` sengaja: nomor rekening & gambar QRIS menunggu pemilik —
// jangan mengisi dengan tebakan (AGENTS.md aturan #3).
export const paymentConfig = {
  qris: {
    enabled: true,
    imagePath: process.env.NEXT_PUBLIC_QRIS_IMAGE_PATH ?? "/assets/payment/qris.png",
    merchantName: "MAU'S Kitchen",
    supportedApps: ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja", "m-banking"],
    note: "Bisa dibayar dari aplikasi e-wallet atau m-banking apa pun.",
  },
  transfer: {
    enabled: true,
    bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "BCA",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "TBD",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "TBD",
  },
  cash: {
    enabled: true,
    label: "Tunai / COD",
    note: "Bayar saat pesanan diterima. Siapkan uang pas ya.",
  },
  paymentWindowMinutes: 60,
} as const;
