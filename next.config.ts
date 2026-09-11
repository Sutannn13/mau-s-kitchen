import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

import { isStagingDeployment } from "./src/config/deployment";

// Aktifkan integrasi `wrangler` saat `next dev` (binding env R2/D1/vars dll).
// No-op di environment lain. Lihat: https://opennext.js.org/cloudflare
initOpenNextCloudflareForDev();

const isDevelopment = process.env.NODE_ENV === "development";
const isStaging = isStagingDeployment(process.env.NEXT_PUBLIC_SITE_URL);
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          ...(isStaging
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isDevelopment
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
  images: {
    // Sajikan AVIF/WebP untuk ukuran transfer lebih kecil di HP
    // (docs/09_TECH_STACK.md §9.7 butir 1).
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75, 80, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Allowlist optimizer untuk foto menu yang di-upload admin —
    // image_path di tabel menu_items menyimpan URL publik Supabase
    // Storage (api/admin/menu/items/[id]/image/route.ts), sedangkan
    // foto seed memakai path lokal /assets/* yang selalu diizinkan.
    // Tanpa ini /_next/image menolak URL remote dengan 400.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
    ],
  },
};

export default nextConfig;
