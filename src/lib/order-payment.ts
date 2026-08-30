import type { OrderStatus, PaymentMethod } from "@/types/order";

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
