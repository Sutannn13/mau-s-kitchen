import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleOff, Star } from "lucide-react";

import { ProductDetailClient } from "@/components/menu/ProductDetailClient";
import { formatRupiah } from "@/lib/format";
import { getCategoryByIdAsync, getCachedMenu, getMenuItemByIdAsync } from "@/lib/menu-data";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menu";

interface ProdukPageProps {
  params: Promise<{ slug: string }>;
}

// Slug produk = id di menu_items. Lihat docs/07_INFORMATION_ARCHITECTURE.md §7.5.
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const loaded = await getCachedMenu();
  return loaded.items.map((item) => ({ slug: item.id }));
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: ProdukPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMenuItemByIdAsync(slug);
  if (!item) {
    return {};
  }

  return {
    title: item.name,
    description: item.description,
    openGraph: {
      images: [{ url: item.image }],
    },
  };
}

// Rekomendasi pendamping "Lengkapi Pesananmu": prioritaskan best seller lalu
// harga termurah. Hanya dari data menu tersedia (tidak mengarang item).
function buildRelatedItems(
  item: MenuItem,
  items: readonly MenuItem[],
): MenuItem[] {
  const others = items.filter(
    (candidate) => candidate.id !== item.id && candidate.available,
  );
  const mains = others.filter((candidate) => !candidate.isAddOnItem);
  const sides = others.filter((candidate) => candidate.isAddOnItem === true);

  const byTop = (arr: MenuItem[]): MenuItem[] =>
    [...arr].sort(
      (a, b) =>
        Number(b.isBestSeller) - Number(a.isBestSeller) ||
        a.basePrice - b.basePrice,
    );
  const take = (arr: MenuItem[], n: number): MenuItem[] => arr.slice(0, n);

  // Item tambahan (Lontong, Sambel) → sarankan menu utama apa pun.
  if (item.isAddOnItem) {
    return take(byTop(mains), 6);
  }

  // Menu utama → menu utama kategori lain + item tambahan (Lontong/Sambel).
  const mainsOtherCat = mains.filter(
    (candidate) => candidate.categoryId !== item.categoryId,
  );
  const related = [...take(byTop(mainsOtherCat), 4), ...take(byTop(sides), 2)];
  if (related.length === 0) {
    return take(byTop(mains), 6);
  }
  return related;
}

export default async function ProdukPage({ params }: ProdukPageProps) {
  const { slug } = await params;
  const item = await getMenuItemByIdAsync(slug);
  if (!item) {
    notFound();
  }

  const category = await getCategoryByIdAsync(item.categoryId);
  if (!category) {
    notFound();
  }

  const loaded = await getCachedMenu();
  const relatedItems = buildRelatedItems(item, loaded.items);

  const variantPrices = item.variants.map((variant) => variant.price);
  const priceLabel =
    variantPrices.length > 0
      ? `${formatRupiah(Math.min(...variantPrices))} – ${formatRupiah(
          Math.max(...variantPrices),
        )}`
      : formatRupiah(item.basePrice);

  return (
    <main className="pb-[calc(env(safe-area-inset-bottom)+8rem)] md:pb-28 lg:pb-0 lg:h-[calc(100dvh-var(--app-header-h)-var(--orderbar-footprint))] lg:overflow-hidden lg:flex lg:flex-col">
      <div className="mx-auto w-full max-w-content px-4 pt-6 md:px-8 md:pt-10 lg:flex lg:flex-1 lg:w-full lg:flex-col lg:min-h-0 lg:px-8 lg:pt-8">
        <nav aria-label="Breadcrumb" className="lg:shrink-0">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-brown/70">
            <li>
              <Link href="/menu" className="rounded px-1 py-0.5 transition-colors hover:text-brown-deep">
                Menu
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" strokeWidth={1.75} />
            </li>
            <li>
              <Link
                href={`/menu/${category.id}`}
                className="rounded px-1 py-0.5 transition-colors hover:text-brown-deep"
              >
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" strokeWidth={1.75} />
            </li>
            <li aria-current="page" className="px-1 font-semibold text-brown-deep">
              {item.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:grid-rows-[minmax(0,1fr)] lg:gap-16">
          {/* Hero produk */}
          <div className="relative detail-scroll lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:pr-1">
            <div className="space-y-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold/20 bg-cream-soft shadow-warm">
                <Image
                  src={item.image}
                  alt={`Poster resmi yang menampilkan ${item.name}`}
                  fill
                  priority
                  quality={80}
                  sizes="(max-width: 1023px) 92vw, 46vw"
                  className={cn(
                    "object-cover",
                    !item.available && "grayscale",
                  )}
                />
                {!item.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
                    <span className="flex min-h-12 items-center gap-2 rounded-full bg-cream px-5 text-sm font-bold text-brown-deep shadow-warm-lg">
                      <CircleOff aria-hidden="true" className="size-4 text-chili" strokeWidth={2} />
                      Habis
                    </span>
                  </div>
                )}
              </div>

              {item.isBestSeller && !item.isAddOnItem && (
                <div className="flex items-center gap-3 rounded-2xl bg-gold/10 px-5 py-3">
                  <Star
                    aria-hidden="true"
                    className="size-5 fill-gold text-gold"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="text-sm font-bold text-brown-deep">Best Seller</p>
                    <p className="text-xs text-brown/70">Paling diminati pelanggan</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info + pemilihan inline + cross-sell */}
          <div className="space-y-6 detail-scroll lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:pb-4 lg:pr-1">
            <div>
              <h1 className="font-serif text-3xl font-bold text-brown-deep md:text-4xl">
                {item.name}
              </h1>
              <p className="mt-3 leading-7 text-brown/80">{item.description}</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-gold">
                  {priceLabel}
                </span>
                {item.variants.length === 0 && (
                  <span className="text-sm text-brown/60">/ {item.unit}</span>
                )}
              </p>
            </div>

            <ProductDetailClient item={item} relatedItems={relatedItems} />
          </div>
        </div>
      </div>
    </main>
  );
}
