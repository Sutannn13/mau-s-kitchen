import { afterEach, describe, expect, it, vi } from "vitest";

async function loadResponseHeaders(siteUrl: string): Promise<Map<string, string>> {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteUrl);

  const { default: nextConfig } = await import("../next.config");
  const routes = await nextConfig.headers?.();

  if (!routes?.[0]) {
    throw new Error("Header route utama tidak tersedia.");
  }

  return new Map(routes[0].headers.map(({ key, value }) => [key, value]));
}

describe("next.config response headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("menambahkan noindex hanya pada build staging", async () => {
    const headers = await loadResponseHeaders(
      "https://staging.maukitchen.my.id",
    );

    expect(headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("mempertahankan security headers production tanpa noindex", async () => {
    const headers = await loadResponseHeaders("https://maukitchen.my.id");

    expect(Object.fromEntries(headers)).toEqual({
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:; upgrade-insecure-requests",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
    });
  });
});
