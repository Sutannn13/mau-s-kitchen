import { describe, expect, it } from "vitest";

import { buildOrderCode } from "@/lib/order-code";

describe("buildOrderCode", () => {
  it("membuat format MK-YYMMDD-XXX sesuai zona Jakarta", () => {
    // 12:00 UTC = 19:00 WIB di hari yang sama.
    expect(buildOrderCode(new Date("2026-08-14T12:00:00Z"), 7)).toBe(
      "MK-260814-007",
    );
  });

  it("menggulir tanggal ke hari berikutnya lewat tengah malam WIB", () => {
    // 17:00 UTC 14 Agustus = 00:00 WIB 15 Agustus.
    expect(buildOrderCode(new Date("2026-08-14T17:00:00Z"), 1)).toBe(
      "MK-260815-001",
    );
  });

  it("mem-pad urutan menjadi tiga digit", () => {
    expect(buildOrderCode(new Date("2026-08-14T12:00:00Z"), 42)).toBe(
      "MK-260814-042",
    );
  });
});
