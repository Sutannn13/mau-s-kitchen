"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleOff, Plus, Star } from "lucide-react";

import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menu";

interface MenuCardProps {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
  priority?: boolean;
}

// Semua item (termasuk item tambahan seperti Lontong & Sambel Taichan)
// memakai kartu penuh dengan foto dan link detail. Perubahan atas desain
// kartu ringkas lama — permintaan pemilik, lihat docs/08_UI_UX_SPEC.md §8.3.
export function MenuCard({ item, onOpen, priority = false }: MenuCardProps) {
  const productHref = `/produk/${item.id}`;

  const variantPrices = item.variants.map((variant) => variant.price);
  // Item bervarian menampilkan rentang harga. Lihat docs/08_UI_UX_SPEC.md §8.3.
  const priceLabel =
    variantPrices.length > 0
      ? `${formatRupiah(Math.min(...variantPrices))} – ${formatRupiah(
          Math.max(...variantPrices),
        )}`
      : formatRupiah(item.basePrice);

  const addButton = (
    <button
      type="button"
      onClick={() => {
        onOpen(item);
      }}
      disabled={!item.available}
      aria-disabled={!item.available}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors",
        item.available
          ? "bg-brown-deep text-cream hover:bg-brown"
          : "cursor-not-allowed bg-neutral-200 text-neutral-400",
      )}
    >
      <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
      Tambah
    </button>
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-cream-soft shadow-warm">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Link
          href={productHref}
          aria-label={`Lihat detail ${item.name}`}
          className="absolute inset-0"
        >
          <Image
            src={item.image}
            alt={`Poster resmi yang menampilkan ${item.name}`}
            fill
            priority={priority}
            quality={70}
            sizes="(max-width: 479px) 92vw, (max-width: 767px) 46vw, (max-width: 1023px) 46vw, (max-width: 1279px) 31vw, 23vw"
            className={cn(
              "object-cover transition duration-300 motion-safe:group-hover:scale-105",
              !item.available && "grayscale",
            )}
          />
        </Link>

        {item.isBestSeller && (
          <span className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-cream/95 px-3 text-xs font-bold text-brown-deep shadow-warm">
            <Star
              aria-hidden="true"
              className="size-4 fill-gold text-gold"
              strokeWidth={1.75}
            />
            Best Seller
          </span>
        )}

        {!item.available && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="flex min-h-11 items-center gap-2 rounded-full bg-cream px-4 text-sm font-bold text-brown-deep shadow-warm-lg">
              <CircleOff
                aria-hidden="true"
                className="size-4 text-chili"
                strokeWidth={2}
              />
              Habis
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-semibold leading-snug text-brown-deep">
          <Link href={productHref} className="transition-colors hover:text-brown">
            {item.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-brown/70">
          {item.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <p className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-gold">
            {priceLabel}
            {item.addOns.length > 0 && (
              <span className="inline-flex items-center" title="Tersedia tambahan">
                <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
                <span className="sr-only">Tersedia tambahan</span>
              </span>
            )}
          </p>
          {addButton}
        </div>
      </div>
    </article>
  );
}
