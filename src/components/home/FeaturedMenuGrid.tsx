"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Toast } from "@/components/common/Toast";
import { Reveal } from "@/components/common/Reveal";
import { ProductSheet } from "@/components/menu/ProductSheet";
import { useCartFly } from "@/components/cart/CartFlyContext";
import { formatRupiah } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import type { MenuItem, ProductSelection } from "@/types/menu";

interface FeaturedMenuGridProps {
  items: MenuItem[];
}

const customStitchImages: Record<string, string> = {
  "taichan-daging": "/assets/stitch/taichan-daging.jpg",
  "choco-berry-original": "/assets/stitch/chocoberry-original.jpg",
  "aren-latte": "/assets/stitch/aren-latte.jpg",
};

const customDescriptions: Record<string, string> = {
  "taichan-daging":
    "Sate ayam pilihan dengan bumbu rahasia yang gurih, disajikan dengan sambal pedas nendang dan jeruk nipis segar.",
  "choco-berry-original":
    "Perpaduan sempurna antara cokelat premium yang pekat dengan kesegaran selai stroberi asli buatan rumah.",
  "aren-latte":
    "Kopi susu dengan espresso blend pilihan dan manisnya gula aren murni yang legit, cocok untuk menemani harimu.",
};

export function FeaturedMenuGrid({ items }: FeaturedMenuGridProps) {
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastIdRef = useRef(0);

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

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const imageSrc = customStitchImages[item.id] ?? item.image;
          const descriptionText =
            customDescriptions[item.id] ?? item.description;

          return (
            <Reveal key={item.id} delay={index * 0.08} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#EAE3DB] bg-white p-4 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-warm-lg">
                {/* Foto Menu */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-cream-soft">
                  <Link
                    href={`/produk/${item.id}`}
                    aria-label={`Lihat detail ${item.name}`}
                    className="absolute inset-0"
                  >
                    <Image
                      src={imageSrc}
                      alt={`Foto hidangan ${item.name}`}
                      fill
                      quality={75}
                      sizes="(max-width: 639px) calc(100vw - 64px), (max-width: 767px) calc((100vw - 120px) / 2), (max-width: 1023px) calc((100vw - 152px) / 2), (max-width: 1263px) calc((100vw - 208px) / 3), 352px"
                      className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
                    />
                  </Link>
                </div>

                {/* Konten Menu */}
                <div className="flex flex-1 flex-col pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-brown-deep sm:text-lg">
                      <Link
                        href={`/produk/${item.id}`}
                        className="transition-colors hover:text-brown"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-gold sm:text-base">
                      {formatRupiah(item.basePrice)}
                    </p>
                  </div>

                  <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-[13px] leading-relaxed text-brown/75 sm:text-sm">
                    {descriptionText}
                  </p>

                  {/* Tombol Tambah */}
                  <div className="mt-5 pt-2">
                    <button
                      type="button"
                      onClick={(event) => handleQuickAdd(item, event.currentTarget)}
                      disabled={!item.available}
                      aria-disabled={!item.available}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#D1C7BD] bg-transparent px-4 text-sm font-semibold text-brown-deep transition-all duration-200 hover:border-[#1A110B] hover:bg-[#1A110B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
                      Tambah
                    </button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
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
