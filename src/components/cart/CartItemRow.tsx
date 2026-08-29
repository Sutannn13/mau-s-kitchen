"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";

import { QuantityStepper } from "@/components/common/QuantityStepper";
import { ConfirmButton } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { lineSubtotal } from "@/lib/pricing";
import type { CartItem } from "@/types/order";

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const unitWithAddOns =
    item.unitPrice + item.addOns.reduce((total, addOn) => total + addOn.price, 0);

  // Saat dihapus, baris collapse (tinggi + opacity turun 250ms) dan
  // baris lain meluncur naik (layout animation) — dipasang di bawah
  // AnimatePresence milik halaman keranjang. reducedMotion="user" dari
  // MotionConfig otomatis mematikan animasi transform/layout ini.
  return (
    <motion.article
      layout
      exit={{
        opacity: 0,
        height: 0,
        padding: 0,
        scale: 0.98,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
      className="flex gap-4 overflow-hidden rounded-2xl border border-gold/20 bg-cream-soft p-4 shadow-warm"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
        <Image
          src={item.image}
          alt={`Poster resmi yang menampilkan ${item.name}`}
          fill
          quality={60}
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-brown-deep sm:text-base">
              {item.name}
              {item.variantName ? (
                <span className="font-semibold text-brown/70">
                  {" "}
                  ({item.variantName})
                </span>
              ) : null}
            </h3>
            <p className="mt-0.5 text-sm tabular-nums text-brown/80">
              {formatRupiah(unitWithAddOns)}
              <span className="text-brown/50"> / item</span>
            </p>
            {item.addOns.length > 0 && (
              <p className="mt-1 text-xs leading-5 text-brown/70">
                + {item.addOns.map((addOn) => addOn.name).join(", ")}
              </p>
            )}
            {item.note ? (
              <p className="mt-1 text-xs italic leading-5 text-brown/60">
                Catatan: {item.note}
              </p>
            ) : null}
          </div>

          {/* Hapus memakai konfirmasi dua langkah inline (pola bersama,
              docs/08 §8.4) — penghapusan punya satu affordance yang jelas. */}
          <ConfirmButton
            onConfirm={onRemove}
            label={<Trash2 aria-hidden="true" className="size-5" strokeWidth={1.75} />}
            confirmLabel="Ya, Hapus"
            aria-label={`Hapus ${item.name} dari keranjang`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-brown/60 transition-colors hover:bg-chili/10 hover:text-chili"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            value={item.quantity}
            onChange={onQuantityChange}
            // min 1: tombol − nonaktif di jumlah 1; penghapusan lewat tombol
            // sampah dua langkah di atas (docs/08_UI_UX_SPEC.md §8.4).
            min={1}
            label={`Jumlah ${item.name}`}
          />
          <p className="text-base font-bold tabular-nums text-brown-deep">
            {formatRupiah(lineSubtotal(item))}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
