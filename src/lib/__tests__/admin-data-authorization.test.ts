import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthorizedAdminServiceClient: vi.fn(),
}));

vi.mock("@/lib/supabase/current-admin", () => ({
  getAuthorizedAdminServiceClient: mocks.getAuthorizedAdminServiceClient,
}));

import { listOrders } from "@/lib/admin/orders";
import { getAdminMenu } from "@/lib/menu-data";

const defaultFilter = {
  page: 1,
  limit: 20,
};

describe("admin data authorization boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menolak pembacaan pesanan sebelum service-role client dibuat", async () => {
    mocks.getAuthorizedAdminServiceClient.mockRejectedValue(
      new Error("UNAUTHORIZED"),
    );

    await expect(listOrders(defaultFilter)).rejects.toThrow("UNAUTHORIZED");
  });

  it("menolak pembacaan menu admin sebelum service-role client dibuat", async () => {
    mocks.getAuthorizedAdminServiceClient.mockRejectedValue(
      new Error("UNAUTHORIZED"),
    );

    await expect(getAdminMenu()).rejects.toThrow("UNAUTHORIZED");
  });

  it("mempertahankan respons konfigurasi setelah sesi admin sah", async () => {
    mocks.getAuthorizedAdminServiceClient.mockResolvedValue(null);

    await expect(listOrders(defaultFilter)).resolves.toBeNull();
    await expect(getAdminMenu()).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    });
    expect(mocks.getAuthorizedAdminServiceClient).toHaveBeenCalledTimes(2);
  });
});
