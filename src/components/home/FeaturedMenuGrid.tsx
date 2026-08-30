"use client";

import { useCallback, useDeferredValue, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { CircleOff, LayoutGrid, Plus, Search, Star } from "lucide-react";

import { Toast } from "@/components/common/Toast";
import { ProductSheet } from "@/components/menu/ProductSheet";
import { useCartFly } from "@/components/cart/CartFlyContext";
import { formatRupiah } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import type { MenuCategory, MenuItem, ProductSelection } from "@/types/menu";

interface FeaturedMenuGridProps {
  categories: MenuCategory[];
  items: MenuItem[];
}

const productImages: Readonly<Record<string, string>> = {
  "taichan-daging": "/assets/stitch/taichan-daging.jpg",
  "choco-berry-original": "/assets/stitch/chocoberry-original.jpg",
  "aren-latte": "/assets/stitch/aren-latte.jpg",
};

export function FeaturedMenuGrid({ categories, items }: FeaturedMenuGridProps) {
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastIdRef = useRef(0);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

  const addItem = useCart((state) => state.addItem);

  const handleToastDismiss = useCallback(() => {
    setToast(null);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveItem(null);
  }, []);

  function handleAdd(selection: ProductSelection): void {
    const item = activeItem;
    if (!item) {
      return;
    }
    addItem(item, selection);
    toastIdRef.current += 1;
    const variantLabel = selection.variant
      ? ` (${selection.variant.name})`
      : "";
    setToast({
      id: toastIdRef.current,
      message: `${item.name}${variantLabel} ditambahkan ke keranjang`,
    });
    setActiveItem(null);
  }

  const { flyFromElement } = useCartFly();

  function handleQuickAdd(item: MenuItem, source?: Element): void {
    if (!item.available) {
      return;
    }
    // Jika item punya varian atau add-on, buka sheet untuk konfirmasi kustomisasi
    if (item.variants.length > 0 || item.addOns.length > 0) {
      setActiveItem(item);
      return;
    }

    // Jika item tanpa varian (misal Taichan Daging / Aren Latte), langsung tambah ke keranjang
    if (source) {
      flyFromElement(source, item.image);
    }
    addItem(item, {
      variant: null,
      addOns: [],
      quantity: 1,
      note: "",
    });
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      message: `${item.name} ditambahkan ke keranjang`,
    });
  }

  const visibleItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "semua" || item.categoryId === activeCategory;
    const matchesSearch =
      deferredSearchTerm.length === 0 ||
      item.name.toLowerCase().includes(deferredSearchTerm) ||
      item.description.toLowerCase().includes(deferredSearchTerm);
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="rounded-[1.75rem] border border-brown-deep/10 bg-cream p-3 shadow-warm md:p-5">
        <label className="relative block">
          <span className="sr-only">Cari menu</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brown/55"
            strokeWidth={2}
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari menu favoritmu"
            className="min-h-12 w-full rounded-2xl border border-gold/25 bg-cream-soft pl-11 pr-4 text-sm text-brown-deep placeholder:text-brown/45 focus:border-gold md:max-w-md"
          />
        </label>

        <div className="-mx-3 mt-4 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2.5 md:min-w-0 md:flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory("semua")}
              aria-pressed={activeCategory === "semua"}
              className={cn(
                "relative flex min-h-14 items-center gap-2 rounded-2xl border px-3 text-xs font-bold transition-colors duration-200",
                activeCategory === "semua"
                  ? "border-brown-deep bg-brown-deep text-cream shadow-warm"
                  : "border-gold/25 bg-cream-soft text-brown-deep hover:border-gold/60",
              )}
            >
              {activeCategory === "semua" && (
                <motion.span
                  layoutId="category-active"
                  className="absolute inset-0 rounded-2xl border border-brown-deep bg-brown-deep shadow-warm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative flex size-8 items-center justify-center rounded-xl bg-gold/15">
                <LayoutGrid aria-hidden="true" className="size-4" />
              </span>
              <span className="relative">Semua</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
                className={cn(
                  "relative flex min-h-14 items-center gap-2 rounded-2xl border px-2.5 pr-3 text-xs font-bold transition-colors duration-200",
                  activeCategory === category.id
                    ? "border-brown-deep bg-brown-deep text-cream shadow-warm"
                    : "border-gold/25 bg-cream-soft text-brown-deep hover:border-gold/60",
                )}
              >
                {activeCategory === category.id && (
                  <motion.span
                    layoutId="category-active"
                    className="absolute inset-0 rounded-2xl border border-brown-deep bg-brown-deep shadow-warm"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <span className="relative size-9 overflow-hidden rounded-xl border border-white/20 bg-cream">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </span>
                <span className="relative">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-gold/30 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brown/65">
            {activeCategory === "semua"
              ? "Semua menu"
              : categories.find((category) => category.id === activeCategory)?.name}
          </p>
          <p className="text-xs tabular-nums text-brown/55">
            {visibleItems.length} pilihan
          </p>
        </div>

        {visibleItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {visibleItems.map((item, index) => {
              const startingPrice =
                item.variants.length > 0
                  ? Math.min(...item.variants.map((variant) => variant.price))
                  : item.basePrice;
              const imageSource = productImages[item.id] ?? item.image;
              return (
                <article
                  key={item.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-brown-deep/10 bg-white shadow-[0_5px_18px_rgba(62,35,24,0.07)] transition duration-300 motion-safe:animate-card-enter motion-safe:hover:-translate-y-1 hover:border-gold/45 hover:shadow-warm-lg"
                  style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                >
                  <div className="relative aspect-square overflow-hidden bg-cream-soft sm:aspect-[4/3]">
                    <Link
                      href={`/produk/${item.id}`}
                      aria-label={`Lihat detail ${item.name}`}
                      className="absolute inset-0"
                    >
                      <Image
                        src={imageSource}
                        alt={`Foto ${item.name}`}
                        fill
                        quality={70}
                        sizes="(max-width: 479px) calc((100vw - 56px) / 2), (max-width: 1023px) calc((100vw - 88px) / 2), 360px"
                        className={cn(
                          "object-cover transition duration-500 motion-safe:group-hover:scale-105",
                          !item.available && "grayscale",
                        )}
                      />
                    </Link>
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
                      {item.isBestSeller ? (
                        <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-cream/95 px-2 text-[10px] font-bold text-brown-deep shadow-sm">
                          <Star aria-hidden="true" className="size-3 fill-gold text-gold" />
                          Favorit
                        </span>
                      ) : (
                        <span />
                      )}
                      {!item.available && (
                        <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-ink/85 px-2 text-[10px] font-bold text-white">
                          <CircleOff aria-hidden="true" className="size-3" />
                          Habis
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-brown-deep sm:min-h-0 sm:text-base">
                      <Link href={`/produk/${item.id}`} className="inline-flex min-h-11 items-center hover:text-brown">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="mt-1 hidden line-clamp-2 text-xs leading-5 text-brown/65 sm:block">
                      {item.description}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-dashed border-gold/20 pt-3">
                      <p className="min-w-0 text-xs font-bold tabular-nums text-brown-deep sm:text-sm sm:text-gold">
                        {item.variants.length > 0 && (
                          <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-brown/50">
                            Mulai
                          </span>
                        )}
                        {formatRupiah(startingPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={(event) => handleQuickAdd(item, event.currentTarget)}
                        disabled={!item.available}
                        aria-label={`Tambah ${item.name}`}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brown-deep text-cream shadow-warm transition-colors hover:bg-brown disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-cream-soft px-5 py-10 text-center">
            <Search aria-hidden="true" className="mx-auto size-6 text-gold" />
            <p className="mt-3 text-sm font-bold text-brown-deep">Menu tidak ditemukan</p>
            <p className="mt-1 text-xs leading-5 text-brown/65">
              Coba kata lain atau pilih kategori berbeda.
            </p>
          </div>
        )}
      </div>

      {activeItem !== null && (
        <ProductSheet
          item={activeItem}
          onClose={handleCloseSheet}
          onAdd={handleAdd}
        />
      )}

      {toast !== null && (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={handleToastDismiss}
        />
      )}
    </>
  );
}
