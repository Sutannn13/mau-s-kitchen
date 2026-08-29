import type {
  DeliveryProvider,
  OrderType,
  PaymentMethod,
} from "@/types/order";

export const deliveryProviderLabels: Record<DeliveryProvider, string> = {
  internal: "Diantar MAU'S Kitchen",
  gosend: "GoSend",
  grabexpress: "GrabExpress",
  other: "Kurir lain",
};

export function isDeliveryPlanReady(input: {
  orderType: OrderType;
  deliveryFee: number | null;
  deliveryProvider: DeliveryProvider | null;
  courierCost: number | null;
}): boolean {
  if (input.orderType === "ambil") {
    return true;
  }
  if (
    input.deliveryFee === null ||
    input.deliveryProvider === null ||
    input.courierCost === null
  ) {
    return false;
  }
  return input.deliveryProvider === "internal"
    ? input.courierCost === 0
    : input.courierCost >= 0;
}

export function isCashDeliveryProviderAllowed(input: {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  deliveryProvider: DeliveryProvider | null;
}): boolean {
  return (
    input.orderType !== "antar" ||
    input.paymentMethod !== "tunai" ||
    input.deliveryProvider === null ||
    input.deliveryProvider === "internal"
  );
}

export function calculateDeliveryMargin(
  deliveryFee: number | null,
  courierCost: number | null,
): number | null {
  if (deliveryFee === null || courierCost === null) {
    return null;
  }
  return deliveryFee - courierCost;
}
