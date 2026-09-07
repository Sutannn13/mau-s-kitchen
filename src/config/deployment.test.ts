import { describe, expect, it } from "vitest";

import { isStagingDeployment } from "@/config/deployment";

describe("isStagingDeployment", () => {
  it("mengenali hostname staging dari konfigurasi deployment", () => {
    expect(isStagingDeployment("https://staging.maukitchen.my.id/")).toBe(true);
  });

  it("tidak menganggap hostname mirip atau konfigurasi invalid sebagai staging", () => {
    expect(
      isStagingDeployment("https://staging.maukitchen.my.id.example.com"),
    ).toBe(false);
    expect(isStagingDeployment("bukan-url")).toBe(false);
    expect(isStagingDeployment(undefined)).toBe(false);
  });
});
