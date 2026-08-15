import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { formatRupiah } from "@/lib/format";
import {
  getCategoryById,
  getCategoryStartingPrice,
  isCategoryId,
  menu,
} from "@/lib/menu";
import { getItemsByCategoryWithOverrides } from "@/lib/menu-availability";
import type { CategoryId } from "@/types/menu";

interface KategoriPageProps {
  params: Promise<{ kategori: string }>;
}

// Salinan SEO dari docs/15_SEO_CONTENT.md §15.2; "{mulai}" diisi dari data
// agar harga tidak pernah di-hardcode di kode.
const categorySeoCopy: Record<CategoryId, { title: string; description: string }> = {
  taichan: {
    title: "Menu Taichan",
    description:
      "Taichan daging & kulit dengan sambal khas. Mulai {mulai}. Pedesnya nampol, rasanya nagih!",
  },
  minuman: {
    title: "Menu Minuman",
    description:
      "Thai Tea, Teh Susu, Aren Latte, dan Teh Original. Mulai {mulai}.",
  },
  chocoberry: {
    title: "ChocoBerry — Buah Coklat Premium",
    description:
      "Strawberry, anggur, dan pisang segar disiram coklat premium. Mulai {mulai}.",
  },
};

export function generateStaticParams(): Array<{ kategori: string }> {
  return menu.categories.map((category) => ({ kategori: category.id }));
}

// Ketersediaan dari menu_overrides tampil maksimal 60 detik (docs/09 §9.6).
export const revalidate = 60;

export async function generateMetadata({
  params,
}: KategoriPageProps): Promise<Metadata> {
  const { kategori } = await params;
  if (!isCategoryId(kategori)) {
    return {};
  }

  const copy = categorySeoCopy[kategori];
  const mulai = formatRupiah(getCategoryStartingPrice(kategori));

  return {
    title: copy.title,
    description: copy.description.replace("{mulai}", mulai),
  };
}

export default async function KategoriPage({ params }: KategoriPageProps) {
  const { kategori } = await params;
  if (!isCategoryId(kategori)) {
    notFound();
  }

  const category = getCategoryById(kategori);
  if (!category) {
    notFound();
  }

  return (
    <main className="pb-16">
      <CategoryTabs active={kategori} />
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <MenuCategorySection
          category={category}
          items={await getItemsByCategoryWithOverrides(kategori)}
          headingLevel="h1"
        />
      </div>
    </main>
  );
}
