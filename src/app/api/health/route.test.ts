import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServiceClient: vi.fn(),
  hasAdminAuthorizationConfigured: vi.fn(),
  isPrivacyConfigurationReady: vi.fn(),
  isPublicReadRateLimited: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: mocks.getServiceClient,
}));
vi.mock("@/lib/supabase/config", () => ({
  hasAdminAuthorizationConfigured: mocks.hasAdminAuthorizationConfigured,
}));
vi.mock("@/lib/privacy", () => ({
  isPrivacyConfigurationReady: mocks.isPrivacyConfigurationReady,
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "192.0.2.40",
  isPublicReadRateLimited: mocks.isPublicReadRateLimited,
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPublicReadRateLimited.mockResolvedValue(false);
  });

  it("menghentikan request terbatas sebelum probe database", async () => {
    const from = vi.fn();
    mocks.getServiceClient.mockReturnValue({ from });
    mocks.hasAdminAuthorizationConfigured.mockReturnValue(true);
    mocks.isPrivacyConfigurationReady.mockReturnValue(true);
    mocks.isPublicReadRateLimited.mockResolvedValue(true);

    const response = await GET(new Request("https://example.test/api/health"));

    expect(response.status).toBe(429);
    expect(from).not.toHaveBeenCalled();
  });

  it("menjalankan probe ringan ketika konfigurasi siap", async () => {
    const limit = vi.fn().mockResolvedValue({ error: null });
    const select = vi.fn().mockReturnValue({ limit });
    mocks.getServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ select }),
    });
    mocks.hasAdminAuthorizationConfigured.mockReturnValue(true);
    mocks.isPrivacyConfigurationReady.mockReturnValue(true);

    const response = await GET(new Request("https://example.test/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toContain("s-maxage=10");
  });
});
