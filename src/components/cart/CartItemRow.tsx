"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";

import { QuantityStepper } from "@/components/common/QuantityStepper";
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

  function handleQuantity(nextQuantity: number): void {
    // Mengurangi dari 1 menawarkan konfirmasi hapus. Lihat docs/08_UI_UX_SPEC.md §8.4.
    if (nextQuantity < 1) {
      if (window.confirm(`Hapus ${item.name} dari keranjang?`)) {
        onRemove();
      }
      return;
    }
    onQuantityChange(nextQuantity);
  }

  return (
    <article className="flex gap-4 rounded-2xl border border-gold/20 bg-cream-soft p-4 shadow-warm">
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

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Hapus ${item.name} dari keranjang?`)) {
                onRemove();
              }
            }}
            aria-label={`Hapus ${item.name} dari keranjang`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-brown/60 transition-colors hover:bg-chili/10 hover:text-chili"
          >
            <Trash2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            value={item.quantity}
            onChange={handleQuantity}
            // min 0 agar tombol − tetap aktif di jumlah 1 dan memicu
            // konfirmasi hapus (docs/08_UI_UX_SPEC.md §8.4).
            min={0}
            label={`Jumlah ${item.name}`}
          />
          <p className="text-base font-bold tabular-nums text-brown-deep">
            {formatRupiah(lineSubtotal(item))}
          </p>
        </div>
      </div>
    </article>
  );
}
