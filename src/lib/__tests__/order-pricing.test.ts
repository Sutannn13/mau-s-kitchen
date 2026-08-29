import { describe, expect, it } from "vitest";

import {
  calculateOrderTotal,
  canEditDeliveryFee,
  getInitialDeliveryFee,
  isOrderTotalFinal,
  statusRequiresFinalTotal,
} from "@/lib/order-pricing";

describe("order pricing", () => {
  it("membuat pickup final dengan ongkir Rp0", () => {
    const fee = getInitialDeliveryFee("ambil");

    expect(fee).toBe(0);
    expect(calculateOrderTotal(35_000, fee)).toBe(35_000);
    expect(isOrderTotalFinal("ambil", fee)).toBe(true);
  });

  it("membuat delivery menunggu ongkir tanpa menganggap subtotal sebagai total final", () => {
    const fee = getInitialDeliveryFee("antar");

    expect(fee).toBeNull();
    expect(calculateOrderTotal(35_000, fee)).toBe(35_000);
    expect(isOrderTotalFinal("antar", fee)).toBe(false);
  });

  it("hanya membuka edit ongkir delivery sebelum pembayaran dan konfirmasi", () => {
    expect(
      canEditDeliveryFee({ orderType: "antar", status: "BARU" }),
    ).toBe(true);
    expect(
      canEditDeliveryFee({
        orderType: "antar",
        status: "BARU",
        paymentClaimedAt: "2026-08-24T05:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      canEditDeliveryFee({ orderType: "ambil", status: "BARU" }),
    ).toBe(false);
    expect(
      canEditDeliveryFee({ orderType: "antar", status: "DIKONFIRMASI" }),
    ).toBe(false);
  });

  it("mewajibkan total final untuk status setelah BARU selain BATAL", () => {
    expect(statusRequiresFinalTotal("BARU")).toBe(false);
    expect(statusRequiresFinalTotal("BATAL")).toBe(false);
    expect(statusRequiresFinalTotal("DIKONFIRMASI")).toBe(true);
    expect(statusRequiresFinalTotal("SELESAI")).toBe(true);
  });
});
