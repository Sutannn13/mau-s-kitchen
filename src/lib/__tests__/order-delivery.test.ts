import { describe, expect, it } from "vitest";

import {
  calculateDeliveryMargin,
  isCashDeliveryProviderAllowed,
  isDeliveryPlanReady,
} from "@/lib/order-delivery";

describe("delivery fulfillment", () => {
  it("menerima pengantaran internal dan kurir eksternal yang lengkap", () => {
    expect(
      isDeliveryPlanReady({
        orderType: "antar",
        deliveryFee: 12_000,
        deliveryProvider: "internal",
        courierCost: 0,
      }),
    ).toBe(true);
    expect(
      isDeliveryPlanReady({
        orderType: "antar",
        deliveryFee: 15_000,
        deliveryProvider: "gosend",
        courierCost: 18_000,
      }),
    ).toBe(true);
  });

  it("menolak rencana parsial dan biaya internal yang tidak nol", () => {
    expect(
      isDeliveryPlanReady({
        orderType: "antar",
        deliveryFee: 12_000,
        deliveryProvider: null,
        courierCost: null,
      }),
    ).toBe(false);
    expect(
      isDeliveryPlanReady({
        orderType: "antar",
        deliveryFee: 12_000,
        deliveryProvider: "internal",
        courierCost: 5_000,
      }),
    ).toBe(false);
  });

  it("membatasi COD ke pengantaran internal", () => {
    expect(
      isCashDeliveryProviderAllowed({
        orderType: "antar",
        paymentMethod: "tunai",
        deliveryProvider: "internal",
      }),
    ).toBe(true);
    expect(
      isCashDeliveryProviderAllowed({
        orderType: "antar",
        paymentMethod: "tunai",
        deliveryProvider: "grabexpress",
      }),
    ).toBe(false);
    expect(
      isCashDeliveryProviderAllowed({
        orderType: "antar",
        paymentMethod: "qris",
        deliveryProvider: "grabexpress",
      }),
    ).toBe(true);
  });

  it("menghitung margin atau subsidi ongkir", () => {
    expect(calculateDeliveryMargin(15_000, 12_000)).toBe(3_000);
    expect(calculateDeliveryMargin(10_000, 13_000)).toBe(-3_000);
    expect(calculateDeliveryMargin(null, 13_000)).toBeNull();
  });
});
