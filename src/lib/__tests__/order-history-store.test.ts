import { describe, expect, it } from "vitest";

import {
  normalizeOrderHistoryEntries,
  ORDER_HISTORY_RETENTION_MS,
} from "@/lib/order-history-store";

const nowMs = Date.parse("2026-08-24T12:00:00.000Z");
const validToken = "wTws-WrDxizgsDXrk-gkCPT4JklJdf-FUrKxGwpLfas";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    code: "MK-260824-001",
    token: validToken,
    status: "BARU",
    paymentMethod: "tunai",
    total: 25000,
    createdAt: new Date(nowMs - 60_000).toISOString(),
    ...overrides,
  };
}

describe("normalizeOrderHistoryEntries", () => {
  it("mempertahankan field minimum dan membuang URL token turunan", () => {
    const result = normalizeOrderHistoryEntries(
      [entry({ trackingUrl: "/pesanan/rahasia", paymentUrl: "/bayar/rahasia" })],
      nowMs,
    );

    expect(result).toEqual([
      {
        code: "MK-260824-001",
        token: validToken,
        status: "BARU",
        paymentMethod: "tunai",
        total: 25000,
        createdAt: "2026-08-24T11:59:00.000Z",
      },
    ]);
  });

  it("membuang entri kedaluwarsa, token rusak, dan kode duplikat", () => {
    const result = normalizeOrderHistoryEntries(
      [
        entry(),
        entry({ total: 30000 }),
        entry({
          code: "MK-OLD",
          createdAt: new Date(nowMs - ORDER_HISTORY_RETENTION_MS - 1).toISOString(),
        }),
        entry({ code: "MK-BAD", token: "token-pendek" }),
      ],
      nowMs,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.total).toBe(25000);
  });
});
