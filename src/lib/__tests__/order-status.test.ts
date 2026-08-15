import { describe, expect, it } from "vitest";

import {
  canTransition,
  getQuickActionTarget,
  isOrderStatus,
} from "@/lib/order-status";

describe("canTransition (docs/04_BUSINESS_FLOW.md §4.3)", () => {
  it("mengizinkan transisi maju yang sah", () => {
    expect(canTransition("BARU", "DIKONFIRMASI")).toBe(true);
    expect(canTransition("BARU", "BATAL")).toBe(true);
    expect(canTransition("DIKONFIRMASI", "DIPROSES")).toBe(true);
    expect(canTransition("DIPROSES", "DIKIRIM")).toBe(true);
    expect(canTransition("DIKIRIM", "SELESAI")).toBe(true);
  });

  it("menolak transisi lompat atau mundur", () => {
    expect(canTransition("BARU", "DIKIRIM")).toBe(false);
    expect(canTransition("BARU", "SELESAI")).toBe(false);
    expect(canTransition("DIKONFIRMASI", "DIKIRIM")).toBe(false);
    expect(canTransition("DIKIRIM", "DIPROSES")).toBe(false);
  });

  it("menolak pembatalan setelah DIPROSES (BR-07)", () => {
    expect(canTransition("DIPROSES", "BATAL")).toBe(false);
    expect(canTransition("DIKIRIM", "BATAL")).toBe(false);
  });

  it("status final tidak bisa berubah", () => {
    expect(canTransition("SELESAI", "BARU")).toBe(false);
    expect(canTransition("BATAL", "DIKONFIRMASI")).toBe(false);
  });
});

describe("getQuickActionTarget", () => {
  it("memberi satu aksi cepat sesuai alur utama", () => {
    expect(getQuickActionTarget("BARU")).toBe("DIKONFIRMASI");
    expect(getQuickActionTarget("DIKONFIRMASI")).toBe("DIPROSES");
    expect(getQuickActionTarget("DIPROSES")).toBe("DIKIRIM");
    expect(getQuickActionTarget("DIKIRIM")).toBe("SELESAI");
  });

  it("tidak ada aksi cepat untuk status final", () => {
    expect(getQuickActionTarget("SELESAI")).toBeNull();
    expect(getQuickActionTarget("BATAL")).toBeNull();
  });
});

describe("isOrderStatus", () => {
  it("menerima enam status resmi", () => {
    expect(isOrderStatus("BARU")).toBe(true);
    expect(isOrderStatus("BATAL")).toBe(true);
  });

  it("menolak nilai asing", () => {
    expect(isOrderStatus("barU")).toBe(false);
    expect(isOrderStatus("DIANTAR")).toBe(false);
    expect(isOrderStatus("")).toBe(false);
  });
});
