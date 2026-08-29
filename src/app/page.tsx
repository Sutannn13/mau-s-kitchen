import { FeaturedMenuSection } from "@/components/home/FeaturedMenuSection";
import { HeroSection } from "@/components/home/HeroSection";
import { KitchenStorySection } from "@/components/home/KitchenStorySection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturedMenuSection />
      <KitchenStorySection />
    </main>
  );
}
