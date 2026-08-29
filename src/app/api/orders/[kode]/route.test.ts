import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOrderByPublicAccess: vi.fn(),
  isPublicReadRateLimited: vi.fn(),
}));

vi.mock("@/lib/admin/orders", () => ({
  AdminError: class AdminError extends Error {},
  updateOrder: vi.fn(),
}));
vi.mock("@/lib/order-store", () => ({
  OrderStoreUnavailableError: class OrderStoreUnavailableError extends Error {},
  getOrderByPublicAccess: mocks.getOrderByPublicAccess,
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "192.0.2.40",
  isPublicReadRateLimited: mocks.isPublicReadRateLimited,
}));
vi.mock("@/lib/supabase/auth", () => ({
  verifyAdminRequest: vi.fn(),
}));

import { GET } from "@/app/api/orders/[kode]/route";

const validToken = "A".repeat(43);

function requestFor(code: string): Request {
  return new Request(
    `https://example.test/api/orders/${code}?token=${validToken}`,
  );
}

describe("GET /api/orders/[kode]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPublicReadRateLimited.mockResolvedValue(false);
  });

  it.each(["1", "2", "../orders"])(
    "menolak kode path tidak valid sebelum rate limit dan database: %s",
    async (code) => {
      const response = await GET(requestFor(encodeURIComponent(code)), {
        params: Promise.resolve({ kode: code }),
      });

      expect(response.status).toBe(404);
      expect(mocks.isPublicReadRateLimited).not.toHaveBeenCalled();
      expect(mocks.getOrderByPublicAccess).not.toHaveBeenCalled();
    },
  );

  it("menghentikan request terbatas sebelum lookup database", async () => {
    mocks.isPublicReadRateLimited.mockResolvedValue(true);

    const response = await GET(requestFor("MK-260827-001"), {
      params: Promise.resolve({ kode: "MK-260827-001" }),
    });

    expect(response.status).toBe(429);
    expect(mocks.getOrderByPublicAccess).not.toHaveBeenCalled();
  });
});
