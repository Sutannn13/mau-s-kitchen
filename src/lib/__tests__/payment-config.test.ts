import { describe, expect, it } from "vitest";

import { requiresPrepayment } from "@/config/payment";

describe("requiresPrepayment", () => {
  it("mengarahkan QRIS dan transfer ke halaman instruksi pembayaran", () => {
    expect(requiresPrepayment("qris")).toBe(true);
    expect(requiresPrepayment("transfer")).toBe(true);
  });

  it("tidak mengarahkan pesanan tunai ke halaman QRIS", () => {
    expect(requiresPrepayment("tunai")).toBe(false);
  });
});
