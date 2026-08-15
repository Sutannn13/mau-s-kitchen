import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleOff, Plus, Star } from "lucide-react";

import { ProductDetailActions } from "@/components/menu/ProductDetailActions";
import { formatRupiah } from "@/lib/format";
import { getCategoryById, getMenuItemById, menu } from "@/lib/menu";
import {
  applyOverrideToItem,
  getAvailabilityOverrides,
} from "@/lib/menu-availability";
import { cn } from "@/lib/utils";

interface ProdukPageProps {
  params: Promise<{ slug: string }>;
}

// Slug produk = id di data/menu.json. Lihat docs/07_INFORMATION_ARCHITECTURE.md §7.5.
export function generateStaticParams(): Array<{ slug: string }> {
  return menu.items.map((item) => ({ slug: item.id }));
}

// Ketersediaan dari menu_overrides tampil maksimal 60 detik (docs/09 §9.6).
export const revalidate = 60;

export async function generateMetadata({
  params,
}: ProdukPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getMenuItemById(slug);
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

export default async function ProdukPage({ params }: ProdukPageProps) {
  const { slug } = await params;
  const baseItem = getMenuItemById(slug);
  if (!baseItem) {
    notFound();
  }

  const item = applyOverrideToItem(baseItem, await getAvailabilityOverrides());
  const category = getCategoryById(item.categoryId);
  if (!category) {
    notFound();
  }

  return (
    <main className="pb-16 md:pb-24">
      <div className="mx-auto w-full max-w-content px-4 pt-6 md:px-8 md:pt-10">
        <nav aria-label="Breadcrumb">
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

        <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-10">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold/20 bg-cream-soft shadow-warm">
            <Image
              src={item.image}
              alt={`Poster resmi yang menampilkan ${item.name}`}
              fill
              priority
              quality={70}
              sizes="(max-width: 767px) 92vw, 46vw"
              className={cn(
                "object-cover",
                !item.available && "grayscale",
              )}
            />
            {!item.available && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/50">
                <span className="flex min-h-11 items-center gap-2 rounded-full bg-cream px-4 text-sm font-bold text-brown-deep shadow-warm-lg">
                  <CircleOff aria-hidden="true" className="size-4 text-chili" strokeWidth={2} />
                  Habis
                </span>
              </span>
            )}
          </div>

          <div>
            {item.isBestSeller && !item.isAddOnItem && (
              <p className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold/15 px-3 text-xs font-bold text-brown-deep">
                <Star aria-hidden="true" className="size-4 fill-gold text-gold" strokeWidth={1.75} />
                Best Seller
              </p>
            )}

            <h1 className="mt-2 font-serif text-3xl font-bold text-brown-deep md:text-4xl">
              {item.name}
            </h1>
            <p className="mt-3 leading-7 text-brown/80">{item.description}</p>

            {item.variants.length > 0 ? (
              // Daftar harga per varian (FR-04), selalu dari data menu.
              <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-brown/60">
                  Harga per ukuran
                </h2>
                <ul className="mt-3 divide-y divide-gold/15">
                  {item.variants.map((variant) => (
                    <li
                      key={variant.id}
                      className="flex min-h-11 items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-semibold text-brown-deep">
                        {variant.name}
                      </span>
                      <span className="font-bold tabular-nums text-gold">
                        {formatRupiah(variant.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-gold">
                  {formatRupiah(item.basePrice)}
                </span>
                <span className="text-sm text-brown/60">/ {item.unit}</span>
              </p>
            )}

            {item.addOns.length > 0 && (
              <section className="mt-4 rounded-2xl border border-gold/20 bg-cream-soft p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-brown/60">
                  Tambahan
                </h2>
                <ul className="mt-3 divide-y divide-gold/15">
                  {item.addOns.map((addOn) => (
                    <li
                      key={addOn.id}
                      className="flex min-h-11 items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-1.5 font-semibold text-brown-deep">
                        <Plus aria-hidden="true" className="size-3.5 text-gold" strokeWidth={2.5} />
                        {addOn.name}
                      </span>
                      <span className="font-bold tabular-nums text-gold">
                        +{formatRupiah(addOn.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-7">
              <ProductDetailActions item={item} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
