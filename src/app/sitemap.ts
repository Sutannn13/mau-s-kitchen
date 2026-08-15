import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { menu } from "@/lib/menu";

// Daftar halaman publik untuk mesin pencari. Lihat docs/15_SEO_CONTENT.md §15.7.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/menu",
    "/tentang",
    "/kontak",
  ].map((path) => ({
    url: `${siteConfig.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = menu.categories.map(
    (category) => ({
      url: `${siteConfig.siteUrl}/menu/${category.id}`,
      lastModified: new Date(menu.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const productRoutes: MetadataRoute.Sitemap = menu.items.map((item) => ({
    url: `${siteConfig.siteUrl}/produk/${item.id}`,
    lastModified: new Date(menu.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
