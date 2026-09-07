import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isPrivacyConfigurationReady: vi.fn(),
  isPublicRateLimited: vi.fn(),
}));

vi.mock("@/lib/privacy", () => ({
  isPrivacyConfigurationReady: mocks.isPrivacyConfigurationReady,
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "192.0.2.40",
  isPublicRateLimited: mocks.isPublicRateLimited,
}));

import { POST } from "@/app/api/orders/route";

describe("POST /api/orders rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPrivacyConfigurationReady.mockReturnValue(true);
    mocks.isPublicRateLimited.mockResolvedValue(true);
  });

  it("menolak checkout setelah lima permintaan per menit dari IP yang sama", async () => {
    const response = await POST(
      new Request("https://maukitchen.my.id/api/orders", {
        method: "POST",
      }),
    );

    expect(mocks.isPublicRateLimited).toHaveBeenCalledWith(
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
});
