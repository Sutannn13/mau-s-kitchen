import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  siteConfig: { siteUrl: "https://maukitchen.my.id" },
}));

vi.mock("@/config/site", () => ({ siteConfig: mocks.siteConfig }));

import { isTrustedOrderRequest } from "@/lib/request-origin";

describe("isTrustedOrderRequest", () => {
  beforeEach(() => {
    mocks.siteConfig.siteUrl = "https://maukitchen.my.id";
  });

  it("menerima origin deployment aktif dan fetch same-origin", () => {
    expect(
      isTrustedOrderRequest(
        new Headers({
          origin: "https://maukitchen.my.id",
          "sec-fetch-site": "same-origin",
        }),
      ),
    ).toBe(true);

    mocks.siteConfig.siteUrl = "https://staging.maukitchen.my.id";
    expect(
      isTrustedOrderRequest(
        new Headers({ origin: "https://staging.maukitchen.my.id" }),
      ),
    ).toBe(true);
  });

  it("menolak request tanpa Origin maupun fetch metadata", () => {
    expect(isTrustedOrderRequest(new Headers())).toBe(false);
    expect(
      isTrustedOrderRequest(
        new Headers({ "sec-fetch-site": "same-origin" }),
      ),
    ).toBe(true);
  });

  it.each([
    { origin: "https://evil.example", fetchSite: "cross-site" },
    { origin: "https://www.maukitchen.my.id", fetchSite: "same-origin" },
    { origin: "http://maukitchen.my.id", fetchSite: "same-origin" },
    { origin: "null", fetchSite: "same-origin" },
    { origin: "", fetchSite: "same-origin" },
  ])("menolak origin browser yang tidak dipercaya: $origin", (headers) => {
    expect(
      isTrustedOrderRequest(
        new Headers({
          origin: headers.origin,
          "sec-fetch-site": headers.fetchSite,
        }),
      ),
    ).toBe(false);
  });

  it("menolak fetch metadata lintas situs walau Origin terlihat benar", () => {
    expect(
      isTrustedOrderRequest(
        new Headers({
          origin: "https://maukitchen.my.id",
          "sec-fetch-site": "same-site",
          host: "maukitchen.my.id",
          "x-forwarded-host": "maukitchen.my.id",
        }),
      ),
    ).toBe(false);
  });
});
