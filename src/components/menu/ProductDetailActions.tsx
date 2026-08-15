"use client";

import { useCallback, useRef, useState } from "react";
import { CircleOff, Plus } from "lucide-react";

import { Toast } from "@/components/common/Toast";
import { ProductSheet } from "@/components/menu/ProductSheet";
import { useCart } from "@/lib/cart-store";
import type { MenuItem, ProductSelection } from "@/types/menu";

interface ProductDetailActionsProps {
  item: MenuItem;
}

export function ProductDetailActions({ item }: ProductDetailActionsProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastIdRef = useRef(0);

  const handleToastDismiss = useCallback(() => {
    setToast(null);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const addItem = useCart((state) => state.addItem);

  function handleAdd(selection: ProductSelection): void {
    addItem(item, selection);
    toastIdRef.current += 1;
    const variantLabel = selection.variant
      ? ` (${selection.variant.name})`
      : "";
    setToast({
      id: toastIdRef.current,
      message: `${item.name}${variantLabel} ditambahkan ke keranjang`,
    });
    setSheetOpen(false);
  }

  // Item habis tetap tampil dengan penanda, tanpa tombol aktif (T2.7).
  if (!item.available) {
    return (
      <p className="inline-flex min-h-11 items-center gap-2 rounded-full bg-neutral-200 px-5 text-sm font-bold text-neutral-500">
        <CircleOff aria-hidden="true" className="size-4" strokeWidth={2} />
        Habis — cek lagi nanti ya
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSheetOpen(true);
        }}
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
        Tambah ke Keranjang
      </button>

      {isSheetOpen && (
        <ProductSheet
          item={item}
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
