import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Aktifkan integrasi `wrangler` saat `next dev` (binding env R2/D1/vars dll).
// No-op di environment lain. Lihat: https://opennext.js.org/cloudflare
initOpenNextCloudflareForDev();

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
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
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isDevelopment
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000",
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
  },
};

export default nextConfig;
