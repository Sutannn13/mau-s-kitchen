import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Verifikasi kontrak cookie-setter yang dipakai AdminSessionRefresher:
// rotasi cookie Supabase oleh supabase-js harus diteruskan ke caller supaya
// route handler bisa menuliskannya ulang di response.
describe("verifyAdminSession: penulisan ulang cookie (cookieSetter)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // process.env di project ini punya tipe literal (env.d.ts), jadi tulis
    // via cast agar test bebas memakai nilai palsu.
    const env = process.env as unknown as Record<string, string | undefined>;
    env.NEXT_PUBLIC_SUPABASE_URL = "https://db.example.supabase.co";
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-tests";
    env.ADMIN_EMAILS = "admin@mauskitchen.test";
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  function makeRequest(cookieHeader: string): Request {
    return new Request("https://staging.maukitchen.my.id/api/admin/session", {
      headers: { cookie: cookieHeader },
    });
  }

  it("meneruskan cookie hasil rotasi ke cookieSetter", async () => {
    const user = { id: "u1", email: "admin@mauskitchen.test", app_metadata: { role: "admin" } };
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: (_url: string, _key: string, options: Record<string, unknown>) => {
        const cookies = options.cookies as {
          getAll: () => Array<{ name: string; value: string }>;
          setAll: (cookies: Array<{ name: string; value: string; options?: unknown }>) => void;
        };
        // Simulasi supabase-js: getUser() memicu rotasi cookie via setAll().
        cookies.setAll([
          { name: "sb-refresh", value: "rotated", options: { httpOnly: true } },
        ]);
        return {
          auth: {
            getUser: async () => ({ data: { user }, error: null }),
          },
        };
      },
    }));
    const auth = await import("@/lib/supabase/auth");

    const cookieSetter = vi.fn();
    const identity = await auth.verifyAdminSession(
      () => [{ name: "sb-refresh", value: "stale" }],
      cookieSetter,
    );

    expect(identity).toEqual({ id: "u1", email: "admin@mauskitchen.test" });
    expect(cookieSetter).toHaveBeenCalledTimes(1);
    expect(cookieSetter).toHaveBeenCalledWith([
      { name: "sb-refresh", value: "rotated", options: { httpOnly: true } },
    ]);
  });

  it("tidak memanggil cookieSetter saat sesi tidak valid (tidak ada cookie ditulis)", async () => {
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: null }, error: { message: "bad jwt" } }),
        },
      }),
    }));
    const auth = await import("@/lib/supabase/auth");

    const cookieSetter = vi.fn();
    const identity = await auth.verifyAdminSession(
      () => [{ name: "sb-refresh", value: "stale" }],
      cookieSetter,
    );

    expect(identity).toBeNull();
    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it("verifyAdminRequest meneruskan cookieSetter dari header request", async () => {
    const user = { id: "u2", email: "owner@mauskitchen.test", app_metadata: { role: "admin" } };
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: (_url: string, _key: string, options: Record<string, unknown>) => {
        const cookies = options.cookies as {
          setAll: (cookies: Array<{ name: string; value: string; options?: unknown }>) => void;
        };
        cookies.setAll([
          { name: "sb-access", value: "new-access", options: { path: "/" } },
        ]);
        return {
          auth: {
            getUser: async () => ({ data: { user }, error: null }),
          },
        };
      },
    }));
    const auth = await import("@/lib/supabase/auth");

    const cookieSetter = vi.fn();
    const identity = await auth.verifyAdminRequest(makeRequest("sb-access=old"), cookieSetter);

    expect(identity).toEqual({ id: "u2", email: "owner@mauskitchen.test" });
    expect(cookieSetter).toHaveBeenCalledWith([
      { name: "sb-access", value: "new-access", options: { path: "/" } },
    ]);
  });
});
