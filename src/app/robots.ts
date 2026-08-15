import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// Area admin & API tidak diindeks. Lihat docs/15_SEO_CONTENT.md §15.7.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
