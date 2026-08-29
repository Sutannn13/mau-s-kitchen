import { afterEach, describe, expect, it } from "vitest";

import { getAdminIdentity } from "@/lib/supabase/auth";

const previousAdminEmails = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (previousAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = previousAdminEmails;
});

describe("getAdminIdentity", () => {
  it("menolak akun biasa walaupun terautentikasi", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    expect(
      getAdminIdentity({ id: "user", email: "stranger@example.com", app_metadata: {} }),
    ).toBeNull();
  });

  it("menerima email allowlist tanpa membedakan huruf besar", () => {
    process.env.ADMIN_EMAILS = "Owner@Example.com";
    expect(
      getAdminIdentity({ id: "owner", email: "owner@example.com", app_metadata: {} }),
    ).toEqual({ id: "owner", email: "owner@example.com" });
  });

  it("menerima custom claim admin", () => {
    delete process.env.ADMIN_EMAILS;
    expect(
      getAdminIdentity({
        id: "owner",
        email: "owner@example.com",
        app_metadata: { role: "admin" },
      }),
    ).not.toBeNull();
  });
});
