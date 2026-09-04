import { describe, expect, it } from "vitest";

import {
  evaluateManualPaymentVerification,
  hasPaymentSubmission,
  normalizePaymentReference,
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

  it("mewajibkan bukti, acknowledgement, dan reference untuk QRIS", () => {
    expect(
      evaluateManualPaymentVerification({
        paymentMethod: "qris",
        paymentClaimedAt: "2026-09-04T01:00:00.000Z",
        paymentProofUrl: null,
        paymentVerified: true,
        paymentReference: "QRIS-1234",
      })?.code,
    ).toBe("PAYMENT_PROOF_REQUIRED");
    expect(
      evaluateManualPaymentVerification({
        paymentMethod: "qris",
        paymentClaimedAt: null,
        paymentProofUrl: "payment-proofs/qris.webp",
        paymentVerified: false,
        paymentReference: "QRIS-1234",
      })?.code,
    ).toBe("PAYMENT_VERIFICATION_REQUIRED");
    expect(
      evaluateManualPaymentVerification({
        paymentMethod: "qris",
        paymentClaimedAt: null,
        paymentProofUrl: "payment-proofs/qris.webp",
        paymentVerified: true,
        paymentReference: " ",
      })?.code,
    ).toBe("PAYMENT_REFERENCE_REQUIRED");
  });

  it("menerima QRIS lengkap dan menormalisasi reference", () => {
    expect(normalizePaymentReference("  qris-ab12  ")).toBe("QRIS-AB12");
    expect(
      evaluateManualPaymentVerification({
        paymentMethod: "qris",
        paymentClaimedAt: null,
        paymentProofUrl: "payment-proofs/qris.webp",
        paymentVerified: true,
        paymentReference: "qris-ab12",
      }),
    ).toBeNull();
  });

  it("mempertahankan alur transfer dengan klaim atau bukti", () => {
    expect(
      evaluateManualPaymentVerification({
        paymentMethod: "transfer",
        paymentClaimedAt: "2026-09-04T01:00:00.000Z",
        paymentProofUrl: null,
        paymentVerified: true,
        paymentReference: null,
      }),
    ).toBeNull();
  });
});
