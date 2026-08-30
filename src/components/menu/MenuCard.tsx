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
      aria-label={`Tambah ${item.name}`}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-warm transition-colors sm:w-auto sm:gap-1.5 sm:px-4",
        item.available
          ? "bg-brown-deep text-cream hover:bg-brown"
          : "cursor-not-allowed bg-neutral-200 text-neutral-400",
      )}
    >
      <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
      <span className="hidden sm:inline">Tambah</span>
    </button>
  );

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-brown-deep/10 bg-white shadow-[0_5px_18px_rgba(62,35,24,0.07)] transition duration-300 hover:border-gold/45 hover:shadow-warm-lg">
      <div className="relative aspect-square overflow-hidden bg-cream-soft sm:aspect-[4/5]">
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
            sizes="(max-width: 479px) calc((100vw - 44px) / 2), (max-width: 767px) calc((100vw - 64px) / 2), (max-width: 1023px) 46vw, (max-width: 1279px) 31vw, 23vw"
            className={cn(
              "object-cover transition duration-300 motion-safe:group-hover:scale-105",
              !item.available && "grayscale",
            )}
          />
        </Link>

        {item.isBestSeller && (
          <span className="absolute left-2 top-2 inline-flex min-h-7 items-center gap-1 rounded-full bg-cream/95 px-2 text-[10px] font-bold text-brown-deep shadow-warm sm:left-auto sm:right-3 sm:top-3 sm:min-h-11 sm:gap-1.5 sm:px-3 sm:text-xs">
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

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-brown-deep sm:min-h-0 sm:text-[17px] sm:font-semibold sm:leading-snug">
          <Link href={productHref} className="transition-colors hover:text-brown">
            {item.name}
          </Link>
        </h3>
        <p className="mt-1.5 hidden line-clamp-2 min-h-10 text-sm leading-5 text-brown/70 sm:block">
          {item.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-4">
          <p className="min-w-0 text-xs font-bold tabular-nums text-gold sm:flex sm:items-center sm:gap-1.5 sm:text-sm">
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
