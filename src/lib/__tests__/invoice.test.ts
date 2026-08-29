import { describe, expect, it } from "vitest";

import { getInvoicePaymentNote, isInvoiceAvailable } from "@/lib/invoice";

describe("invoice", () => {
  it("tersedia sejak pesanan dikonfirmasi sampai selesai", () => {
    expect(isInvoiceAvailable("DIKONFIRMASI")).toBe(true);
    expect(isInvoiceAvailable("DIPROSES")).toBe(true);
    expect(isInvoiceAvailable("DIKIRIM")).toBe(true);
    expect(isInvoiceAvailable("SELESAI")).toBe(true);
  });

  it("tidak tersedia untuk pesanan baru atau batal", () => {
    expect(isInvoiceAvailable("BARU")).toBe(false);
    expect(isInvoiceAvailable("BATAL")).toBe(false);
    expect(() => getInvoicePaymentNote("qris", "BARU")).toThrow(
      "Invoice hanya tersedia",
    );
  });

  it("tidak menyebut tunai lunas sebelum ada data verifikasi khusus", () => {
    expect(getInvoicePaymentNote("tunai", "DIKONFIRMASI")).toBe(
      "Pembayaran tunai/COD dilakukan saat pesanan diterima",
    );
    expect(getInvoicePaymentNote("qris", "DIKONFIRMASI")).toBe(
      "Pembayaran sudah dikonfirmasi admin",
    );
  });
});
