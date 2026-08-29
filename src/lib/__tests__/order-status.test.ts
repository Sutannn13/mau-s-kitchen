import { describe, expect, it } from "vitest";

import {
  canTransition,
  getAdminTargets,
  isOrderStatus,
} from "@/lib/order-status";

describe("canTransition (docs/04_BUSINESS_FLOW.md §4.3)", () => {
  it("mengizinkan transisi maju yang sah", () => {
    expect(canTransition("BARU", "DIKONFIRMASI")).toBe(true);
    expect(canTransition("DIKONFIRMASI", "DIPROSES")).toBe(true);
    expect(canTransition("DIPROSES", "DIKIRIM")).toBe(true);
    expect(canTransition("DIKIRIM", "SELESAI")).toBe(true);
  });

  it("mengizinkan admin lompat maju lebih dari satu status", () => {
    expect(canTransition("BARU", "DIKIRIM")).toBe(true);
    expect(canTransition("BARU", "SELESAI")).toBe(true);
    expect(canTransition("DIKONFIRMASI", "DIKIRIM")).toBe(true);
    expect(canTransition("DIKONFIRMASI", "SELESAI")).toBe(true);
    expect(canTransition("DIPROSES", "SELESAI")).toBe(true);
  });

  it("mengizinkan admin membatalkan selama belum final (override BR-07)", () => {
    expect(canTransition("BARU", "BATAL")).toBe(true);
    expect(canTransition("DIKONFIRMASI", "BATAL")).toBe(true);
    expect(canTransition("DIPROSES", "BATAL")).toBe(true);
    expect(canTransition("DIKIRIM", "BATAL")).toBe(true);
  });

  it("menolak transisi mundur atau ke status yang sama", () => {
    expect(canTransition("DIKIRIM", "DIPROSES")).toBe(false);
    expect(canTransition("DIKONFIRMASI", "BARU")).toBe(false);
    expect(canTransition("SELESAI", "DIKIRIM")).toBe(false);
    expect(canTransition("BARU", "BARU")).toBe(false);
  });

  it("status final tidak bisa berubah", () => {
    expect(canTransition("SELESAI", "BARU")).toBe(false);
    expect(canTransition("SELESAI", "BATAL")).toBe(false);
    expect(canTransition("BATAL", "DIKONFIRMASI")).toBe(false);
  });
});

describe("getAdminTargets", () => {
  it("memuat semua status di depan + Batal untuk status aktif", () => {
    expect(getAdminTargets("BARU")).toEqual([
      "DIKONFIRMASI",
      "DIPROSES",
      "DIKIRIM",
      "SELESAI",
      "BATAL",
    ]);
    expect(getAdminTargets("DIKONFIRMASI")).toEqual([
      "DIPROSES",
      "DIKIRIM",
      "SELESAI",
      "BATAL",
    ]);
    expect(getAdminTargets("DIPROSES")).toEqual(["DIKIRIM", "SELESAI", "BATAL"]);
    expect(getAdminTargets("DIKIRIM")).toEqual(["SELESAI", "BATAL"]);
  });

  it("tidak ada pilihan untuk status final", () => {
    expect(getAdminTargets("SELESAI")).toEqual([]);
    expect(getAdminTargets("BATAL")).toEqual([]);
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
