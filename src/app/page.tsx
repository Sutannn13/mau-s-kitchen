import { BestSellerSection } from "@/components/home/BestSellerSection";
import { BrandValuesSection } from "@/components/home/BrandValuesSection";
import { CategorySection } from "@/components/home/CategorySection";
import { ChocoBerryHighlight } from "@/components/home/ChocoBerryHighlight";
import { ClosingCta } from "@/components/home/ClosingCta";
import { HeroSection } from "@/components/home/HeroSection";
import { HowToOrderSection } from "@/components/home/HowToOrderSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CategorySection />
      <BestSellerSection />
      <ChocoBerryHighlight />
      <BrandValuesSection />
      <HowToOrderSection />
      <ClosingCta />
    </main>
  );
}
