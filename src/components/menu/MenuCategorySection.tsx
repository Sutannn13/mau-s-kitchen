"use client";

import { useCallback, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";

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

// Stagger masuk kartu menu: tiap kartu fade-up 8px dengan jeda 30ms —
// ringan, opacity/transform saja, dan otomatis dilucuti transformnya oleh
// MotionConfig reducedMotion="user". Kartu bermain setelah skeleton
// selesai, jadi tidak menunda paint awal halaman.
const gridVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

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
    <section id={category.id} className="scroll-mt-[144px] py-5 md:py-10">
      <header className="mb-4 flex items-end justify-between gap-3 border-b border-dashed border-gold/30 pb-3 md:mb-5">
        <Heading className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
          {category.name}
        </Heading>
        <p className="max-w-[48%] text-right text-[11px] leading-4 text-brown/65 sm:text-sm sm:italic">
          {category.tagline}
        </p>
      </header>

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        <MenuGrid>
          {items.map((item, index) => (
            <motion.div key={item.id} variants={cardVariants} className="h-full">
              <MenuCard
                item={item}
                onOpen={setActiveItem}
                priority={headingLevel === "h1" && index === 0}
              />
            </motion.div>
          ))}
        </MenuGrid>
      </motion.div>

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
