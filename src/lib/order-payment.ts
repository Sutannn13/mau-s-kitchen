import type { OrderStatus, PaymentMethod } from "@/types/order";

export const PAYMENT_REFERENCE_MIN_LENGTH = 4;
export const PAYMENT_REFERENCE_MAX_LENGTH = 100;
const PAYMENT_REFERENCE_PATTERN = /^[A-Z0-9][A-Z0-9 ._:/#-]*$/;

export function normalizePaymentReference(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidPaymentReference(value: string): boolean {
  const normalized = normalizePaymentReference(value);
  return (
    normalized.length >= PAYMENT_REFERENCE_MIN_LENGTH &&
    normalized.length <= PAYMENT_REFERENCE_MAX_LENGTH &&
    PAYMENT_REFERENCE_PATTERN.test(normalized)
  );
}

// Static QRIS/transfer cannot be verified automatically; require an explicit
// admin acknowledgement at the server boundary before leaving BARU.
export function requiresManualPaymentVerification(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  paymentMethod: PaymentMethod,
): boolean {
  return (
    currentStatus === "BARU" &&
    targetStatus !== "BATAL" &&
    paymentMethod !== "tunai"
  );
}

export function hasPaymentSubmission(
  paymentClaimedAt: string | null | undefined,
  paymentProofUrl: string | null | undefined,
): boolean {
  return Boolean(paymentClaimedAt || paymentProofUrl);
}

interface PaymentVerificationInput {
  paymentMethod: PaymentMethod;
  paymentClaimedAt: string | null | undefined;
  paymentProofUrl: string | null | undefined;
  paymentVerified: boolean;
  paymentReference: string | null | undefined;
}

export interface PaymentVerificationError {
  code:
    | "PAYMENT_PROOF_REQUIRED"
    | "PAYMENT_SUBMISSION_REQUIRED"
    | "PAYMENT_VERIFICATION_REQUIRED"
    | "PAYMENT_REFERENCE_REQUIRED";
  message: string;
}

// QRIS statis memerlukan bukti dan referensi mutasi unik; transfer mempertahankan
// alur klaim/bukti lama sampai integrasi rekening menyediakan ID transaksi baku.
export function evaluateManualPaymentVerification({
  paymentMethod,
  paymentClaimedAt,
  paymentProofUrl,
  paymentVerified,
  paymentReference,
}: PaymentVerificationInput): PaymentVerificationError | null {
  if (paymentMethod === "qris" && !paymentProofUrl) {
    return {
      code: "PAYMENT_PROOF_REQUIRED",
      message: "Bukti pembayaran QRIS wajib diunggah sebelum pesanan dikonfirmasi.",
    };
  }
  if (
    paymentMethod === "transfer" &&
    !hasPaymentSubmission(paymentClaimedAt, paymentProofUrl)
  ) {
    return {
      code: "PAYMENT_SUBMISSION_REQUIRED",
      message: "Pelanggan belum mengirim klaim atau bukti pembayaran.",
    };
  }
  if (!paymentVerified) {
    return {
      code: "PAYMENT_VERIFICATION_REQUIRED",
      message:
        "Periksa mutasi rekening atau bukti bayar dan cocokkan nominal sebelum mengonfirmasi pesanan.",
    };
  }
  if (
    paymentMethod === "qris" &&
    (!paymentReference || !isValidPaymentReference(paymentReference))
  ) {
    return {
      code: "PAYMENT_REFERENCE_REQUIRED",
      message: `Referensi transaksi QRIS wajib ${PAYMENT_REFERENCE_MIN_LENGTH}-${PAYMENT_REFERENCE_MAX_LENGTH} karakter.`,
    };
  }
  return null;
}
