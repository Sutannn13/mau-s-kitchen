import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sajikan AVIF/WebP untuk ukuran transfer lebih kecil di HP
    // (docs/09_TECH_STACK.md §9.7 butir 1).
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
