import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CookieOptions } from "@supabase/ssr";

const mocks = vi.hoisted(() => ({
  verifyAdminRequest: vi.fn(),
}));

type RotatedCookie = { name: string; value: string; options: CookieOptions };

vi.mock("@/lib/supabase/auth", () => ({
  verifyAdminRequest: mocks.verifyAdminRequest,
}));

import { GET } from "@/app/api/admin/session/route";

// GET /api/admin/session adalah heartbeat AdminSessionRefresher. Kontraknya:
// cookie hasil rotasi Supabase harus ter-set di response agar sesi admin
// bertahan (OpenNext/Cloudflare belum menjalankan Node Proxy Next 16).
describe("GET /api/admin/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function requestWithCookie(cookieHeader?: string): Request {
    const headers = new Headers();
    if (cookieHeader) headers.set("cookie", cookieHeader);
    return new Request("https://staging.maukitchen.my.id/api/admin/session", {
      headers,
    });
  }

  it("menuliskan cookie hasil rotasi Supabase ke response saat sesi valid", async () => {
    mocks.verifyAdminRequest.mockImplementation(
      async (
        _request: Request,
        cookieSetter?: (cookies: RotatedCookie[]) => void,
      ) => {
        cookieSetter?.([
          {
            name: "sb-refresh",
            value: "rotated",
            options: { httpOnly: true, path: "/", sameSite: "lax", secure: true },
          },
        ]);
        return { id: "u1", email: "owner@mauskitchen.test" };
      },
    );

    const response = await GET(requestWithCookie("sb-refresh=stale"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { email: "owner@mauskitchen.test" },
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");

    const setCookie = response.headers.getSetCookie?.() ?? [];
    const refreshCookie = setCookie.find((cookie) => cookie.startsWith("sb-refresh="));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("rotated");
    expect(refreshCookie).toContain("HttpOnly");
  });

  it("tetap menuliskan cookie rotasi saat sesi tidak valid (401) bila Supabase memutar cookie", async () => {
    mocks.verifyAdminRequest.mockImplementation(
      async (
        _request: Request,
        cookieSetter?: (cookies: RotatedCookie[]) => void,
      ) => {
        cookieSetter?.([
          {
            name: "sb-access",
            value: "refreshed-access",
            options: { path: "/" },
          },
        ]);
        return null;
      },
    );

    const response = await GET(requestWithCookie("sb-access=old"));

    expect(response.status).toBe(401);
    const setCookie = response.headers.getSetCookie?.() ?? [];
    const accessCookie = setCookie.find((cookie) => cookie.startsWith("sb-access="));
    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain("refreshed-access");
  });

  it("mengembalikan 401 tanpa cookie saat tidak ada rotasi dan sesi tidak valid", async () => {
    mocks.verifyAdminRequest.mockResolvedValue(null);

    const response = await GET(requestWithCookie("sb-refresh=stale"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "UNAUTHORIZED",
    });
    const setCookie = response.headers.getSetCookie?.() ?? [];
    expect(setCookie.filter((cookie) => cookie.startsWith("sb-"))).toEqual([]);
  });
});
