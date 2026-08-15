import type { Metadata } from "next";

import { JsonLd } from "@/components/common/JsonLd";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { formatRupiah } from "@/lib/format";
import { menu } from "@/lib/menu";
import { getItemsByCategoryWithOverrides } from "@/lib/menu-availability";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Menu & Harga",
  description:
    "Lihat menu lengkap Taichan, Minuman, dan ChocoBerry beserta harganya. Pesan langsung lewat WhatsApp.",
};

// Ketersediaan dari menu_overrides tampil maksimal 60 detik (docs/09 §9.6).
export const revalidate = 60;

// Structured data Menu + MenuItem agar harga bisa muncul di hasil pencarian
// (docs/15_SEO_CONTENT.md §15.3).
function menuJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `Menu ${siteConfig.name}`,
    hasMenuSection: [...menu.categories]
      .sort((a, b) => a.order - b.order)
      .map((category) => ({
        "@type": "MenuSection",
        name: category.name,
        hasMenuItem: menu.items
          .filter((item) => item.categoryId === category.id && !item.isAddOnItem)
          .map((item) => ({
            "@type": "MenuItem",
            name: item.name,
            description: item.description,
            offers: {
              "@type": "Offer",
              price: item.basePrice,
              priceCurrency: "IDR",
            },
          })),
      })),
  };
}

export default async function MenuPage() {
  const categories = [...menu.categories].sort((a, b) => a.order - b.order);
  const sections = await Promise.all(
    categories.map(async (category) => ({
      category,
      items: await getItemsByCategoryWithOverrides(category.id),
    })),
  );
  const cheapestPrice = Math.min(...menu.items.map((item) => item.basePrice));

  return (
    <main className="pb-16">
      <JsonLd data={menuJsonLd()} />
      <div className="mx-auto w-full max-w-content px-4 pb-6 pt-8 md:px-8 md:pt-12">
        <h1 className="font-serif text-3xl font-bold text-brown-deep md:text-4xl">
          Menu &amp; Harga
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-brown/80">
          Lihat menu lengkap Taichan, Minuman, dan ChocoBerry beserta
          harganya mulai {formatRupiah(cheapestPrice)}. Pesan langsung lewat
          WhatsApp.
        </p>
      </div>

      <CategoryTabs active="semua" />

      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        {sections.map(({ category, items }) => (
          <MenuCategorySection
            key={category.id}
            category={category}
            items={items}
          />
        ))}
      </div>
    </main>
  );
}
