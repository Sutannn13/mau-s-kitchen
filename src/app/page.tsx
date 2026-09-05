import type { Metadata } from "next";
import { JsonLd } from "@/components/common/JsonLd";
import { BrandValuesSection } from "@/components/home/BrandValuesSection";
import { ChocoBerryHighlight } from "@/components/home/ChocoBerryHighlight";
import { ClosingCta } from "@/components/home/ClosingCta";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedMenuSection } from "@/components/home/FeaturedMenuSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowToOrderSection } from "@/components/home/HowToOrderSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { LayoutGrid, Star, UtensilsCrossed, Wallet } from "lucide-react";
import { getEnabledPaymentMethods } from "@/config/payment";
import { siteConfig } from "@/config/site";
import { getCachedMenu } from "@/lib/menu-data";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Keep this on the domain homepage: Google uses WebSite as its primary site-name signal.
function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: "maukitchen.my.id",
    url: `${siteConfig.siteUrl}/`,
  };
}

export default async function HomePage() {
  const menu = await getCachedMenu();
  const menuCount = menu.items.filter((item) => !item.isAddOnItem).length;
  const categoryCount = menu.categories.length;
  const bestSellerCount = menu.items.filter(
    (item) => item.isBestSeller && !item.isAddOnItem,
  ).length;
  const paymentMethodCount = getEnabledPaymentMethods().length;

  const stats = [
    { value: menuCount, suffix: "", label: "Pilihan menu", icon: UtensilsCrossed },
    { value: categoryCount, suffix: "", label: "Kategori", icon: LayoutGrid },
    { value: bestSellerCount, suffix: "", label: "Menu unggulan", icon: Star },
    { value: paymentMethodCount, suffix: "", label: "Cara bayar", icon: Wallet },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <main>
        <HeroSection />
        <StatsStrip stats={stats} />
        <BrandValuesSection />
        <FeaturedMenuSection />
        <ChocoBerryHighlight />
        <HowToOrderSection />
        <FaqSection />
        <ClosingCta />
      </main>
    </>
  );
}
