import { describe, expect, it } from "vitest";

import {
  buildPublicOrderUrl,
  isValidOrderAccessToken,
} from "@/lib/order-access";
import type { OrderHistoryEntry } from "@/lib/order-history-store";
import {
  buildRecoveryOrderUrl,
  findRecoveryEntry,
  isValidRecoveryToken,
  parseOrderScopeCode,
  resolveOrderSearch,
  shouldRecoverRedirect,
} from "@/lib/order-recovery";

const validToken = "wTws-WrDxizgsDXrk-gkCPT4JklJdf-FUrKxGwpLfas";

function makeEntry(
  overrides: Partial<OrderHistoryEntry> = {},
): OrderHistoryEntry {
  return {
    code: "MK-260822-009",
    token: validToken,
    status: "BARU",
    paymentMethod: "tunai",
    total: 35000,
    createdAt: "2026-08-22T11:00:27.451786+00:00",
    ...overrides,
  };
}

describe("parseOrderScopeCode", () => {
  it("membaca scope dan kode dari pathname rute pelanggan", () => {
    expect(parseOrderScopeCode("/pesanan/MK-260822-009")).toEqual({
      scope: "pesanan",
      code: "MK-260822-009",
    });
    expect(parseOrderScopeCode("/pembayaran/MK-260822-009")).toEqual({
      scope: "pembayaran",
      code: "MK-260822-009",
    });
  });

  it("menolak pathname di luar rute pesanan/pembayaran", () => {
    expect(parseOrderScopeCode("/")).toBeNull();
    expect(parseOrderScopeCode("/menu/taichan")).toBeNull();
    expect(parseOrderScopeCode("/admin/pesanan/MK-1")).toBeNull();
    expect(parseOrderScopeCode("/pesanan")).toBeNull();
    expect(parseOrderScopeCode("/pesanan/MK-1/extra")).toBeNull();
  });

  it("menolak persen-encoding rusak tanpa melempar error", () => {
    expect(parseOrderScopeCode("/pesanan/MK-%E0%A4")).toBeNull();
  });
});

describe("isValidRecoveryToken (sinkron dengan lib/order-access)", () => {
  it("sepakat dengan isValidOrderAccessToken untuk berbagai bentuk token", () => {
    const samples = [
      validToken,
      validToken.slice(0, 42),
      validToken + "x",
      "ada spasi dan tanda+bahaya*",
      "",
    ];
    for (const sample of samples) {
      expect(isValidRecoveryToken(sample)).toBe(
        isValidOrderAccessToken(sample),
      );
    }
  });
});

describe("buildRecoveryOrderUrl (sinkron dengan buildPublicOrderUrl)", () => {
  it("menghasilkan URL yang sama dengan versi server", () => {
    for (const scope of ["pesanan", "pembayaran"] as const) {
      expect(buildRecoveryOrderUrl(scope, "MK-260822-009", validToken)).toBe(
        buildPublicOrderUrl(scope, "MK-260822-009", validToken),
      );
    }
  });
});

describe("findRecoveryEntry", () => {
  it("menemukan entri dengan kode dan token sah", () => {
    const entries = [
      makeEntry({ code: "MK-260822-008" }),
      makeEntry(),
    ];
    expect(findRecoveryEntry(entries, "MK-260822-009")).toEqual(
      makeEntry(),
    );
  });

  it("mengabaikan entri dengan token tidak sah atau kode berbeda", () => {
    const entries = [
      makeEntry({ token: "pendek" }),
      makeEntry({ code: "MK-260822-008" }),
    ];
    expect(findRecoveryEntry(entries, "MK-260822-009")).toBeNull();
  });
});

describe("shouldRecoverRedirect", () => {
  it("redirect hanya bila token riwayat berbeda dari token di URL", () => {
    const entry = makeEntry();
    expect(shouldRecoverRedirect(entry, validToken)).toBe(false);
    expect(shouldRecoverRedirect(entry, "")).toBe(true);
    expect(
      shouldRecoverRedirect(entry, "beda-" + validToken.slice(5)),
    ).toBe(true);
  });
});

describe("resolveOrderSearch", () => {
  it("memakai token lokal untuk kode yang tersimpan", () => {
    expect(
      resolveOrderSearch("mk-260822-009", [makeEntry()], "https://mauskitchen.id"),
    ).toEqual({
      ok: true,
      url: `/pesanan/MK-260822-009?token=${validToken}`,
    });
  });

  it("menerima tautan privat lengkap tanpa membuka redirect eksternal", () => {
    expect(
      resolveOrderSearch(
        `https://contoh.invalid/pesanan/MK-260822-009?token=${validToken}`,
        [],
        "https://mauskitchen.id",
      ),
    ).toEqual({
      ok: true,
      url: `/pesanan/MK-260822-009?token=${validToken}`,
    });
  });

  it("menolak kode asing tanpa token dan tautan yang tidak sah", () => {
    expect(
      resolveOrderSearch("MK-260822-009", [], "https://mauskitchen.id"),
    ).toEqual({ ok: false, reason: "missing-token" });
    expect(
      resolveOrderSearch("https://contoh.invalid/admin", [], "https://mauskitchen.id"),
    ).toEqual({ ok: false, reason: "invalid" });
  });
});
