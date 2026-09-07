import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isPrivacyConfigurationReady: vi.fn(),
  isStrictPublicRateLimited: vi.fn(),
  isTrustedOrderRequest: vi.fn(),
}));

vi.mock("@/lib/privacy", () => ({
  isPrivacyConfigurationReady: mocks.isPrivacyConfigurationReady,
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "192.0.2.40",
  isStrictPublicRateLimited: mocks.isStrictPublicRateLimited,
}));

vi.mock("@/lib/request-origin", () => ({
  isTrustedOrderRequest: mocks.isTrustedOrderRequest,
}));

import { POST } from "@/app/api/orders/route";

describe("POST /api/orders rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPrivacyConfigurationReady.mockReturnValue(true);
    mocks.isStrictPublicRateLimited.mockResolvedValue(true);
    mocks.isTrustedOrderRequest.mockReturnValue(true);
  });

  it("menolak checkout setelah lima permintaan per menit dari IP yang sama", async () => {
    const response = await POST(
      new Request("https://maukitchen.my.id/api/orders", {
        method: "POST",
      }),
    );

    expect(mocks.isStrictPublicRateLimited).toHaveBeenCalledWith(
      "ORDER_CREATE_RATE_LIMITER",
      "order-create:192.0.2.40",
      { maxRequests: 5, windowSeconds: 60 },
    );
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "RATE_LIMITED",
    });
  });

  it("menolak origin lintas situs sebelum rate limit dan checkout", async () => {
    mocks.isTrustedOrderRequest.mockReturnValue(false);

    const response = await POST(
      new Request("https://maukitchen.my.id/api/orders", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
        },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "UNTRUSTED_ORIGIN",
    });
    expect(mocks.isStrictPublicRateLimited).not.toHaveBeenCalled();
  });
});
