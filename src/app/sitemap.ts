import type { MetadataRoute } from "next";

import { getCachedMenu, type LoadedMenu } from "@/lib/menu-data";
import { siteConfig } from "@/config/site";

function parseModificationDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

function getLatestMenuModification(loaded: LoadedMenu): Date | undefined {
  const timestamps = [
    loaded.updatedAt,
    ...loaded.categories.map((category) => category.updatedAt),
    ...loaded.items.map((item) => item.updatedAt),
  ]
    .map(parseModificationDate)
    .filter((date): date is Date => date !== undefined)
    .map((date) => date.getTime());

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;
}

export function createSitemap(
  loaded: LoadedMenu,
  siteUrl: string,
): MetadataRoute.Sitemap {
  const baseUrl = siteUrl.replace(/\/+$/, "");
  const menuLastModified = getLatestMenuModification(loaded);
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: menuLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: menuLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tentang`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kontak`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = loaded.categories.map(
    (category) => ({
      url: `${baseUrl}/menu/${category.id}`,
      lastModified:
        parseModificationDate(category.updatedAt) ?? menuLastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const productRoutes: MetadataRoute.Sitemap = loaded.items.map((item) => ({
    url: `${baseUrl}/produk/${item.id}`,
    lastModified: parseModificationDate(item.updatedAt) ?? menuLastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

// Sitemap tetap mengikuti menu hidup, tetapi tanggal hanya berubah saat konten
// benar-benar berubah agar sinyal lastmod tetap dipercaya crawler.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await getCachedMenu(), siteConfig.siteUrl);
}
