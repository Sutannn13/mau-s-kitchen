import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  getServiceClient: vi.fn(),
  isAdminDataAccessConfigured: vi.fn(),
  redirect: vi.fn(),
  verifyAdminSession: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/auth", () => ({
  verifyAdminSession: mocks.verifyAdminSession,
}));
vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: mocks.getServiceClient,
}));
vi.mock("@/lib/supabase/config", () => ({
  isAdminDataAccessConfigured: mocks.isAdminDataAccessConfigured,
}));

import { getAuthorizedAdminServiceClient } from "@/lib/supabase/current-admin";

describe("getAuthorizedAdminServiceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdminDataAccessConfigured.mockReturnValue(true);
    mocks.cookies.mockResolvedValue({
      getAll: () => [{ name: "sb-session", value: "valid" }],
    });
    mocks.getServiceClient.mockReturnValue({ kind: "service-client" });
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("melanjutkan akses ketika sesi admin terverifikasi", async () => {
    mocks.verifyAdminSession.mockResolvedValue({
      id: "admin-id",
      email: "owner@example.com",
    });

    await expect(getAuthorizedAdminServiceClient()).resolves.toEqual({
      kind: "service-client",
    });
    expect(mocks.verifyAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.verifyAdminSession.mock.calls[0]?.[0]()).toEqual([
      { name: "sb-session", value: "valid" },
    ]);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("menghentikan akses sebelum DAL berjalan ketika sesi tidak sah", async () => {
    mocks.verifyAdminSession.mockResolvedValue(null);

    await expect(getAuthorizedAdminServiceClient()).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("mempertahankan mode setup tanpa membuat service-role client", async () => {
    mocks.isAdminDataAccessConfigured.mockReturnValue(false);

    await expect(getAuthorizedAdminServiceClient()).resolves.toBeNull();
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.verifyAdminSession).not.toHaveBeenCalled();
    expect(mocks.getServiceClient).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
