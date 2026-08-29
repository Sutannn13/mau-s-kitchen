import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { formatRupiah } from "@/lib/format";
import {
  getCachedMenu,
  getCategoryByIdAsync,
  getCategoryStartingPriceAsync,
  getItemsByCategoryAsync,
  isCategoryIdAsync,
} from "@/lib/menu-data";

interface KategoriPageProps {
  params: Promise<{ kategori: string }>;
}

// Salinan SEO dari docs/15_SEO_CONTENT.md §15.2; "{mulai}" diisi dari data DB.
// Kategori dinamis yang belum punya salinan pakai default generik di bawah.
const categorySeoCopy: Record<string, { title: string; description: string }> = {
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

const defaultSeoCopy = {
  title: "Menu Kategori",
  description: "Pilihan menu MAU'S Kitchen. Mulai {mulai}.",
};

export async function generateStaticParams(): Promise<Array<{ kategori: string }>> {
  const loaded = await getCachedMenu();
  return loaded.categories.map((category) => ({ kategori: category.id }));
}

// Ketersediaan dari DB tampil maksimal 60 detik (docs/09 §9.6).
export const revalidate = 60;

export async function generateMetadata({
  params,
}: KategoriPageProps): Promise<Metadata> {
  const { kategori } = await params;
  if (!(await isCategoryIdAsync(kategori))) {
    return {};
  }

  const copy = categorySeoCopy[kategori] ?? defaultSeoCopy;
  const mulai = formatRupiah(await getCategoryStartingPriceAsync(kategori));

  return {
    title: copy.title,
    description: copy.description.replace("{mulai}", mulai),
  };
}

export default async function KategoriPage({ params }: KategoriPageProps) {
  const { kategori } = await params;
  const loaded = await getCachedMenu();
  const categories = [...loaded.categories].sort((a, b) => a.order - b.order);

  const category = await getCategoryByIdAsync(kategori);
  if (!category) {
    notFound();
  }

  return (
    <main className="pb-6 md:pb-16">
      <CategoryTabs active={kategori} categories={categories} />
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <MenuCategorySection
          category={category}
          items={await getItemsByCategoryAsync(kategori)}
          headingLevel="h1"
        />
      </div>
    </main>
  );
}
