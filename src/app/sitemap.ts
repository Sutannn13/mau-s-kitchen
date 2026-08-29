import type { MetadataRoute } from "next";

import { getCachedMenu } from "@/lib/menu-data";
import { siteConfig } from "@/config/site";

// Daftar halaman publik untuk mesin pencari. Lihat docs/15_SEO_CONTENT.md §15.7.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const loaded = await getCachedMenu();
  const lastModified = new Date(loaded.updatedAt);

  const categoryRoutes: MetadataRoute.Sitemap = loaded.categories.map(
    (category) => ({
      url: `${siteConfig.siteUrl}/menu/${category.id}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const productRoutes: MetadataRoute.Sitemap = loaded.items.map((item) => ({
    url: `${siteConfig.siteUrl}/produk/${item.id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
