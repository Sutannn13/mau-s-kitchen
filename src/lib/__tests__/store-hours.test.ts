import { describe, expect, it } from "vitest";

import {
  getStoreStatus,
  jakartaMinutes,
  parseBusinessHours,
} from "@/lib/store-hours";

describe("parseBusinessHours", () => {
  it("mengurai format '08.00–21.00'", () => {
    expect(parseBusinessHours("08.00–21.00")).toEqual({
      openMinutes: 8 * 60,
      closeMinutes: 21 * 60,
    });
  });

  it("mengurai format '8:00 - 21:00'", () => {
    expect(parseBusinessHours("8:00 - 21:00")).toEqual({
      openMinutes: 8 * 60,
      closeMinutes: 21 * 60,
    });
  });

  it("mendukung rentang lewat tengah malam (18.00–01.00)", () => {
    expect(parseBusinessHours("18.00–01.00")).toEqual({
      openMinutes: 18 * 60,
      closeMinutes: 25 * 60, // 01:00 hari berikutnya
    });
  });

  it("mengembalikan null untuk TBD / format tak dikenali", () => {
    expect(parseBusinessHours(null)).toBeNull();
    expect(parseBusinessHours("TBD")).toBeNull();
    expect(parseBusinessHours("konfirmasi via WhatsApp")).toBeNull();
  });
});

describe("jakartaMinutes", () => {
  it("menghasilkan nilai 0–1439 (menit dalam sehari)", () => {
    const m = jakartaMinutes(new Date("2026-08-19T12:30:00+07:00"));
    expect(m).toBeGreaterThanOrEqual(0);
    expect(m).toBeLessThanOrEqual(1439);
  });

  it("konsisten dengan instan WIB 12:30 → 750 menit", () => {
    expect(jakartaMinutes(new Date("2026-08-19T12:30:00+07:00"))).toBe(750);
  });
});

describe("getStoreStatus", () => {
  const hours = { openMinutes: 8 * 60, closeMinutes: 21 * 60 };

  it("'open' bila dalam rentang", () => {
    expect(getStoreStatus(new Date("2026-08-19T12:30:00+07:00"), hours)).toBe(
      "open",
    );
  });

  it("'closed' bila sebelum buka", () => {
    expect(getStoreStatus(new Date("2026-08-19T07:00:00+07:00"), hours)).toBe(
      "closed",
    );
  });

  it("'closed' bila setelah tutup", () => {
    expect(getStoreStatus(new Date("2026-08-19T22:00:00+07:00"), hours)).toBe(
      "closed",
    );
  });

  it("'unknown' bila jam tak dikonfirmasi", () => {
    expect(getStoreStatus(new Date(), null)).toBe("unknown");
  });
});
