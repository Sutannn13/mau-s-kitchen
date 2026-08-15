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
}

export function MenuCard({ item, onOpen }: MenuCardProps) {
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

  // Item tambahan (Lontong, Sambel Taichan) memakai kartu ringkas
  // tanpa foto besar. Lihat docs/08_UI_UX_SPEC.md §8.3.
  if (item.isAddOnItem) {
    return (
      <article className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-cream-soft px-4 py-3 shadow-warm">
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brown-deep">
            <Link href={productHref} className="transition-colors hover:text-brown">
              {item.name}
            </Link>
            {!item.available && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-bold text-neutral-500">
                <CircleOff aria-hidden="true" className="size-3.5" strokeWidth={2} />
                Habis
              </span>
            )}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-brown/70">
            {item.description}
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-gold">
            {formatRupiah(item.basePrice)}
          </p>
        </div>
        {addButton}
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-cream-soft shadow-warm">
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
            quality={70}
            sizes="(max-width: 479px) 92vw, (max-width: 767px) 46vw, (max-width: 1023px) 46vw, (max-width: 1279px) 31vw, 23vw"
            className={cn(
              "object-cover transition duration-300 group-hover:scale-105",
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
