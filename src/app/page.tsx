import { BrandValuesSection } from "@/components/home/BrandValuesSection";
import { ChocoBerryHighlight } from "@/components/home/ChocoBerryHighlight";
import { ClosingCta } from "@/components/home/ClosingCta";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedMenuSection } from "@/components/home/FeaturedMenuSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowToOrderSection } from "@/components/home/HowToOrderSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { getEnabledPaymentMethods } from "@/config/payment";
import { getCachedMenu } from "@/lib/menu-data";

export default async function HomePage() {
  const menu = await getCachedMenu();
  const menuCount = menu.items.filter((item) => !item.isAddOnItem).length;
  const categoryCount = menu.categories.length;
  const bestSellerCount = menu.items.filter(
    (item) => item.isBestSeller && !item.isAddOnItem,
  ).length;
  const paymentMethodCount = getEnabledPaymentMethods().length;

  const stats = [
    { value: menuCount, suffix: "", label: "Pilihan menu" },
    { value: categoryCount, suffix: "", label: "Kategori" },
    { value: bestSellerCount, suffix: "", label: "Menu unggulan" },
    { value: paymentMethodCount, suffix: "", label: "Cara bayar" },
  ];

  return (
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
  );
}
