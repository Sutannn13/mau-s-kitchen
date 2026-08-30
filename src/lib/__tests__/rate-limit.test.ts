import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIp } from "@/lib/rate-limit";

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
