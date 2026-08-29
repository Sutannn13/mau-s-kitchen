import type { OrderStatus, OrderType } from "@/types/order";

export function getInitialDeliveryFee(orderType: OrderType): number | null {
  return orderType === "ambil" ? 0 : null;
}

export function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number | null,
): number {
  return subtotal + (deliveryFee ?? 0);
}

export function isOrderTotalFinal(
  orderType: OrderType,
  deliveryFee: number | null,
): boolean {
  return orderType === "ambil" || deliveryFee !== null;
}

export function canEditDeliveryFee(input: {
  orderType: OrderType;
  status: OrderStatus;
  paymentClaimedAt?: string | null;
  paymentProofUrl?: string | null;
}): boolean {
  return (
    input.orderType === "antar" &&
    input.status === "BARU" &&
    !input.paymentClaimedAt &&
    !input.paymentProofUrl
  );
}

export function statusRequiresFinalTotal(status: OrderStatus): boolean {
  return status !== "BARU" && status !== "BATAL";
}
