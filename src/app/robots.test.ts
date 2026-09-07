import { describe, expect, it } from "vitest";

import { createRobots } from "@/app/robots";

describe("createRobots", () => {
  it("tidak mengiklankan sitemap pada staging", () => {
    expect(createRobots("https://staging.maukitchen.my.id")).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    });
  });

  it("mempertahankan kebijakan indexing production", () => {
    expect(createRobots("https://maukitchen.my.id")).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      sitemap: "https://maukitchen.my.id/sitemap.xml",
    });
  });
});
