import { describe, expect, it } from "vitest";

import { createSitemap } from "@/app/sitemap";
import type { LoadedMenu } from "@/lib/menu-data";

const menuFixture: LoadedMenu = {
  version: "test",
  updatedAt: "2026-09-01T00:00:00.000Z",
  currency: "IDR",
  brand: {
    name: "MAU'S Kitchen",
    tagline: "Homemade with Love",
    whatsapp: "6281617691585",
    whatsappDisplay: "0816-1769-1585",
  },
  categories: [
    {
      id: "taichan",
      name: "Taichan",
      tagline: "Pedesnya nampol, rasanya nagih!",
      image: "/assets/menu/menu-taichan.jpeg",
      order: 1,
      updatedAt: "2026-09-02T00:00:00.000Z",
    },
  ],
  items: [
    {
      id: "taichan-daging",
      categoryId: "taichan",
      name: "Taichan Daging",
      description: "Sate ayam dengan sambal taichan.",
      basePrice: 35000,
      variants: [],
      addOns: [],
      image: "/assets/menu/menu-taichan.jpeg",
      available: true,
      isBestSeller: true,
      unit: "porsi",
      updatedAt: "2026-09-03T00:00:00.000Z",
    },
  ],
  source: "fallback",
};

describe("createSitemap", () => {
  it("memakai tanggal perubahan konten terbaru dan URL absolut", () => {
    const result = createSitemap(menuFixture, "https://example.test/");

    expect(result[0]).toMatchObject({
      url: "https://example.test",
      lastModified: new Date("2026-09-03T00:00:00.000Z"),
    });
    expect(result.find((entry) => entry.url.endsWith("/menu/taichan"))).toMatchObject(
      {
        lastModified: new Date("2026-09-02T00:00:00.000Z"),
      },
    );
    expect(
      result.find((entry) => entry.url.endsWith("/produk/taichan-daging")),
    ).toMatchObject({
      lastModified: new Date("2026-09-03T00:00:00.000Z"),
    });
  });

  it("tidak mengarang lastmod untuk halaman statis tanpa sumber tanggal", () => {
    const result = createSitemap(menuFixture, "https://example.test");

    expect(result.find((entry) => entry.url.endsWith("/tentang"))).not.toHaveProperty(
      "lastModified",
    );
    expect(result.find((entry) => entry.url.endsWith("/kontak"))).not.toHaveProperty(
      "lastModified",
    );
  });
});
