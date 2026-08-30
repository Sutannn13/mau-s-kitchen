import { describe, expect, it } from "vitest";

import {
  hasPaymentSubmission,
  requiresManualPaymentVerification,
} from "@/lib/order-payment";

describe("manual payment verification gate", () => {
  it.each(["qris", "transfer"] as const)(
    "mewajibkan verifikasi untuk %s sebelum keluar dari BARU",
    (paymentMethod) => {
      expect(
        requiresManualPaymentVerification(
          "BARU",
          "DIKONFIRMASI",
          paymentMethod,
        ),
      ).toBe(true);
      expect(
        requiresManualPaymentVerification("BARU", "SELESAI", paymentMethod),
      ).toBe(true);
    },
  );

  it("tidak meminta verifikasi pembayaran untuk tunai atau pembatalan", () => {
    expect(
      requiresManualPaymentVerification("BARU", "DIKONFIRMASI", "tunai"),
    ).toBe(false);
    expect(
      requiresManualPaymentVerification("BARU", "BATAL", "qris"),
    ).toBe(false);
  });

  it("tidak meminta verifikasi ulang setelah pesanan dikonfirmasi", () => {
    expect(
      requiresManualPaymentVerification("DIKONFIRMASI", "DIPROSES", "qris"),
    ).toBe(false);
  });

  it("menerima klaim atau bukti sebagai syarat pengajuan pembayaran", () => {
    expect(hasPaymentSubmission(null, null)).toBe(false);
    expect(hasPaymentSubmission("2026-08-30T01:00:00.000Z", null)).toBe(true);
    expect(hasPaymentSubmission(null, "payment-proofs/order.webp")).toBe(true);
  });
});
