import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { isStagingDeployment } from "@/config/deployment";

// Area admin & API tidak diindeks. Lihat docs/15_SEO_CONTENT.md §15.7.
export function createRobots(siteUrl: string): MetadataRoute.Robots {
  if (isStagingDeployment(siteUrl)) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

export default function robots(): MetadataRoute.Robots {
  return createRobots(siteConfig.siteUrl);
}
