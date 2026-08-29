// Konfigurasi pembayaran Fase 1. Lihat docs/12_PAYMENT_QRIS.md §12.5.
// Nilai rekening tetap `TBD`; QRIS memakai aset resmi yang diberikan pemilik.
import type { PaymentMethod } from "@/types/order";

function enabledFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === "true";
}

function isReadyValue(value: string): boolean {
  return value.trim().length > 0 && value.trim().toUpperCase() !== "TBD";
}

const bankAccountNumber = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "TBD";
const bankAccountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "TBD";
const qrisMerchantName =
  process.env.NEXT_PUBLIC_QRIS_MERCHANT_NAME?.trim() || "SATE TAICHAN HANNA";

export const paymentConfig = {
  qris: {
    enabled: enabledFlag(process.env.NEXT_PUBLIC_ENABLE_QRIS, false),
    imagePath:
      process.env.NEXT_PUBLIC_QRIS_IMAGE_PATH ?? "/assets/payment/qris.jpeg",
    merchantName: qrisMerchantName,
    supportedApps: ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja", "m-banking"],
    note: "Bisa dibayar dari aplikasi e-wallet atau m-banking apa pun.",
  },
  transfer: {
    enabled:
      enabledFlag(process.env.NEXT_PUBLIC_ENABLE_TRANSFER, false) &&
      isReadyValue(bankAccountNumber) &&
      isReadyValue(bankAccountName),
    bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "BCA",
    accountNumber: bankAccountNumber,
    accountName: bankAccountName,
  },
  cash: {
    enabled: enabledFlag(process.env.NEXT_PUBLIC_ENABLE_CASH, true),
    label: "Tunai / COD",
    note: "Bayar saat pesanan diterima. Siapkan uang pas ya.",
  },
  paymentWindowMinutes: 60,
} as const;

export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  if (method === "qris") return paymentConfig.qris.enabled;
  if (method === "transfer") return paymentConfig.transfer.enabled;
  return paymentConfig.cash.enabled;
}

// Hanya metode bayar di muka yang memakai halaman instruksi pembayaran.
export function requiresPrepayment(method: PaymentMethod): boolean {
  return method === "qris" || method === "transfer";
}

export function getEnabledPaymentMethods(): PaymentMethod[] {
  return (["qris", "transfer", "tunai"] as const).filter(
    isPaymentMethodEnabled,
  );
}

export function getDefaultPaymentMethod(): PaymentMethod {
  return getEnabledPaymentMethods()[0] ?? "tunai";
}
