import type { Metadata, Viewport } from "next";
import {
  Bebas_Neue,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";

import { ChromeShell } from "@/components/layout/ChromeShell";
import { JsonLd } from "@/components/common/JsonLd";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-playfair",
  display: "optional",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: "MAU'S Kitchen — Taichan, Minuman & ChocoBerry",
    template: "%s | MAU'S Kitchen",
  },
  description:
    "Sate taichan pedas, minuman segar, dan ChocoBerry buah coklat premium. Pesan online tanpa login. Homemade with Love.",
  keywords: ["taichan", "sate taichan", "chocoberry", "thai tea", "MAU'S Kitchen"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "MAU'S Kitchen",
    title: "MAU'S Kitchen — Taichan, Minuman & ChocoBerry",
    description: siteConfig.description,
    images: [
      {
        url: "/assets/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "MAU'S Kitchen — Homemade with Love",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7EEE4",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

// Structured data Restaurant per docs/15_SEO_CONTENT.md §15.3.
// Alamat hanya diterbitkan jika sudah dikonfirmasi pemilik.
function restaurantJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteConfig.name,
    description:
      "UMKM kuliner rumahan: sate taichan, minuman, dan dessert ChocoBerry.",
    slogan: siteConfig.tagline,
    image: `${siteConfig.siteUrl}/assets/brand/logo-maus-kitchen.jpeg`,
    telephone: `+${siteConfig.whatsappNumber}`,
    servesCuisine: ["Indonesian", "Street Food", "Dessert"],
    priceRange: "Rp5.000 - Rp48.000",
    acceptsReservations: false,
    ...(siteConfig.businessAddress
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "ID",
            streetAddress: siteConfig.businessAddress,
          },
        }
      : {}),
    potentialAction: {
      "@type": "OrderAction",
      target: `${siteConfig.siteUrl}/menu`,
    },
  };
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Penyembunyian chrome publik pada rute /admin/* kini deteksi pathname
  // di ChromeShell (client) — sebelumnya via header `x-admin-route` yang
  // ditempel proxy, tetapi proxy Next 16 memaksa runtime Node.js yang
  // tidak didukung OpenNext Cloudflare (Edge-only), jadi proxy dihapus.
  // Autentikasi admin tetap dijaga di (panel)/layout.tsx (lapisan kedua).

  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body
        className={cn(
          plusJakartaSans.variable,
          playfairDisplay.variable,
          bebasNeue.variable,
        )}
      >
        <JsonLd data={restaurantJsonLd()} />
        <ChromeShell>{children}</ChromeShell>
      </body>
    </html>
  );
}
