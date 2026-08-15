"use client";

import { useCallback, useRef, useState } from "react";

import { Toast } from "@/components/common/Toast";
import { MenuCard } from "@/components/menu/MenuCard";
import { MenuGrid } from "@/components/menu/MenuGrid";
import { ProductSheet } from "@/components/menu/ProductSheet";
import { useCart } from "@/lib/cart-store";
import type {
  MenuCategory,
  MenuItem,
  ProductSelection,
} from "@/types/menu";

interface MenuCategorySectionProps {
  category: MenuCategory;
  items: MenuItem[];
  // Halaman kategori memakai section ini sebagai judul utama halaman.
  headingLevel?: "h1" | "h2";
}

export function MenuCategorySection({
  category,
  items,
  headingLevel = "h2",
}: MenuCategorySectionProps) {
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastIdRef = useRef(0);

  const handleToastDismiss = useCallback(() => {
    setToast(null);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveItem(null);
  }, []);

  const addItem = useCart((state) => state.addItem);

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

  const Heading = headingLevel;

  return (
    // scroll-mt menutup header 72px + bar tab sticky agar anchor tidak
    // tertutup elemen menempel. Lihat docs/08_UI_UX_SPEC.md §8.3.
    <section id={category.id} className="scroll-mt-[144px] py-8 md:py-10">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
          {category.name}
        </Heading>
        <p className="text-sm italic text-brown/70">{category.tagline}</p>
      </header>

      <MenuGrid>
        {items.map((item) => (
          <MenuCard key={item.id} item={item} onOpen={setActiveItem} />
        ))}
      </MenuGrid>

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
    </section>
  );
}
