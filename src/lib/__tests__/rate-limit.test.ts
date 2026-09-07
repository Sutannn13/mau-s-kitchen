import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}));

import { getClientIp, isPublicRateLimited } from "@/lib/rate-limit";

describe("getClientIp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mengabaikan header Cloudflare yang dikirim langsung saat development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEPLOYMENT_PLATFORM", "cloudflare");

    expect(
      getClientIp(new Headers({ "cf-connecting-ip": "198.51.100.4" })),
    ).toBe("unknown");
  });

  it("memakai IP valid pada runtime production Cloudflare", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_PLATFORM", "cloudflare");

    expect(
      getClientIp(new Headers({ "cf-connecting-ip": "198.51.100.4" })),
    ).toBe("198.51.100.4");
  });

  it("menolak daftar IP atau nilai bukan IP", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_PLATFORM", "cloudflare");

    expect(
      getClientIp(
        new Headers({ "cf-connecting-ip": "198.51.100.4, 203.0.113.9" }),
      ),
    ).toBe("unknown");
    expect(
      getClientIp(new Headers({ "cf-connecting-ip": "attacker" })),
    ).toBe("unknown");
  });
});

describe("Cloudflare rate limiting", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("meneruskan lima request lalu memblokir request keenam", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_PLATFORM", "cloudflare");
    const limit = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    mocks.getCloudflareContext.mockResolvedValue({
      env: { ORDER_CREATE_RATE_LIMITER: { limit } },
    });
    const key = "order-create:198.51.100.4";
    const options = { maxRequests: 5, windowSeconds: 60 };

    for (let requestNumber = 0; requestNumber < 5; requestNumber += 1) {
      expect(
        await isPublicRateLimited(
          "ORDER_CREATE_RATE_LIMITER",
          key,
          options,
        ),
      ).toBe(false);
    }
    expect(
      await isPublicRateLimited("ORDER_CREATE_RATE_LIMITER", key, options),
    ).toBe(true);
    expect(limit).toHaveBeenCalledTimes(6);
    expect(limit).toHaveBeenLastCalledWith({ key });
  });

  it("gagal tertutup ketika binding checkout tidak tersedia", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_PLATFORM", "cloudflare");
    mocks.getCloudflareContext.mockResolvedValue({ env: {} });

    await expect(
      isPublicRateLimited(
        "ORDER_CREATE_RATE_LIMITER",
        "order-create:198.51.100.4",
        { maxRequests: 5, windowSeconds: 60 },
      ),
    ).resolves.toBe(true);
  });
});
