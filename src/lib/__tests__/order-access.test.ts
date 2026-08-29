import { describe, expect, it } from "vitest";

import {
  buildPublicOrderUrl,
  generateOrderAccessToken,
  isValidOrderAccessToken,
  tokensMatch,
} from "@/lib/order-access";

describe("order access token", () => {
  it("membuat token acak 256-bit yang valid", () => {
    const first = generateOrderAccessToken();
    const second = generateOrderAccessToken();
    expect(first).toHaveLength(43);
    expect(isValidOrderAccessToken(first)).toBe(true);
    expect(first).not.toBe(second);
  });

  it("membandingkan token tanpa menerima format rusak", () => {
    const token = generateOrderAccessToken();
    expect(tokensMatch(token, token)).toBe(true);
    expect(tokensMatch(token, generateOrderAccessToken())).toBe(false);
    expect(tokensMatch(token, "pendek")).toBe(false);
  });

  it("menyertakan token pada URL pelanggan", () => {
    const token = generateOrderAccessToken();
    expect(buildPublicOrderUrl("pesanan", "MK-260816-001", token)).toBe(
      `/pesanan/MK-260816-001?token=${token}`,
    );
    expect(buildPublicOrderUrl("invoice", "MK-260816-001", token)).toBe(
      `/invoice/MK-260816-001?token=${token}`,
    );
  });
});
