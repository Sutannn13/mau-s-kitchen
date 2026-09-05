"use client";

import { useId, useRef, useState } from "react";
import { ShoppingBag, X } from "lucide-react";

import { useCartFly } from "@/components/cart/CartFlyContext";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import { formatRupiah } from "@/lib/format";
import { lineSubtotal } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { MenuItem, ProductSelection } from "@/types/menu";

interface ProductSheetProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (selection: ProductSelection) => void;
}

const NOTE_MAX_LENGTH = 200;
// Ambang swipe-down untuk menutup sheet. Lihat docs/08_UI_UX_SPEC.md §8.3.
const SWIPE_CLOSE_THRESHOLD_PX = 80;

export function ProductSheet({ item, onClose, onAdd }: ProductSheetProps) {
  const titleId = useId();
  const radioGroupName = useId();
  const noteId = useId();

  // A11y (role=dialog/trap/Esc/focus-restore/scroll-lock) dipusatkan di
  // useDialogA11y — dipakai bersama admin MenuItemEditor (Batch 5). Swipe &
  // posisi sheet tetap di sini (tidak diubah).
  const { dialogRef, handleKeyDown } = useDialogA11y({ onClose });

  const touchStartYRef = useRef<number | null>(null);

  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { flyFromElement } = useCartFly();

  const requiresVariant = item.variants.length > 0;
  const selectedVariant =
    item.variants.find((variant) => variant.id === variantId) ?? null;
  const isVariantValid = !requiresVariant || selectedVariant !== null;
  const selectedAddOns = item.addOns.filter((addOn) =>
    selectedAddOnIds.has(addOn.id),
  );
  // Total tombol dihitung dari data (bukan harga yang dikirim browser).
  // Lihat docs/16_TESTING_QA.md §16.5 untuk kasus ujinya.
  const ctaTotal = isVariantValid
    ? lineSubtotal({
        unitPrice: selectedVariant?.price ?? item.basePrice,
        addOns: selectedAddOns,
        quantity,
      })
    : null;

  function toggleAddOn(addOnId: string): void {
    setSelectedAddOnIds((previous) => {
      const next = new Set(previous);
      if (next.has(addOnId)) {
        next.delete(addOnId);
      } else {
        next.add(addOnId);
      }
      return next;
    });
  }

  function handleAdd(event: React.MouseEvent<HTMLButtonElement>): void {
    if (!isVariantValid) {
      return;
    }
    flyFromElement(event.currentTarget, item.image);
    onAdd({
      variant: selectedVariant,
      addOns: selectedAddOns,
      quantity,
      note: note.trim(),
    });
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>): void {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    touchStartYRef.current = touch.clientY;
    setIsDragging(true);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>): void {
    const startY = touchStartYRef.current;
    const touch = event.touches[0];
    if (startY === null || !touch) {
      return;
    }
    // Hanya gerakan turun yang menarik sheet mengikuti jari.
    setDragOffset(Math.max(0, touch.clientY - startY));
  }

  function handleTouchEnd(): void {
    touchStartYRef.current = null;
    setIsDragging(false);
    if (dragOffset > SWIPE_CLOSE_THRESHOLD_PX) {
      onClose();
      return;
    }
    setDragOffset(0);
  }

  const optionRowClass = (checked: boolean): string =>
    cn(
      "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-5 py-3 transition-all duration-200",
      checked
        ? "border-gold bg-gold/10 shadow-warm"
        : "border-gold/20 bg-cream hover:border-gold/40 hover:bg-gold/5",
    );

  return (
    <div className="fixed inset-0 z-dialog">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-fade-in motion-reduce:animate-none absolute inset-0 bg-ink/60"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }}
        className="animate-sheet-up motion-reduce:animate-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg outline-none"
      >
        <div className="flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-gold/30 bg-cream-soft shadow-warm-lg">
          {/* Zona seret: handle + judul menjadi tempat gesture swipe-down. */}
          <div
            className="shrink-0 cursor-grab touch-none px-5 pb-4 pt-2"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span
              aria-hidden="true"
              className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-brown/25"
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id={titleId} className="text-xl font-bold text-brown-deep">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm leading-6 text-brown/70">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-brown transition-colors hover:bg-gold/15"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
            {requiresVariant && (
              <fieldset className="border-0 p-0">
                <legend className="text-sm font-bold text-brown-deep">
                  Pilih Ukuran{" "}
                  <span aria-hidden="true" className="text-chili">
                    *
                  </span>
                  <span className="sr-only">(wajib memilih satu)</span>
                </legend>
                <div className="mt-3 space-y-2">
                  {item.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className={optionRowClass(variantId === variant.id)}
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold text-brown-deep">
                        <input
                          type="radio"
                          name={radioGroupName}
                          value={variant.id}
                          checked={variantId === variant.id}
                          onChange={() => {
                            setVariantId(variant.id);
                          }}
                          className="size-4 accent-gold"
                        />
                        {variant.name}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-brown-deep">
                        {formatRupiah(variant.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {item.addOns.length > 0 && (
              <fieldset className={cn("border-0 p-0", requiresVariant && "mt-5")}>
                <legend className="text-sm font-bold text-brown-deep">
                  Tambahan
                </legend>
                <div className="mt-3 space-y-2">
                  {item.addOns.map((addOn) => (
                    <label
                      key={addOn.id}
                      className={optionRowClass(selectedAddOnIds.has(addOn.id))}
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold text-brown-deep">
                        <input
                          type="checkbox"
                          checked={selectedAddOnIds.has(addOn.id)}
                          onChange={() => {
                            toggleAddOn(addOn.id);
                          }}
                          className="size-4 accent-gold"
                        />
                        {addOn.name}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-brown-deep">
                        +{formatRupiah(addOn.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-5">
              <label
                htmlFor={noteId}
                className="text-sm font-bold text-brown-deep"
              >
                Catatan{" "}
                <span className="font-normal text-brown/60">(opsional)</span>
              </label>
              <textarea
                id={noteId}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                }}
                maxLength={NOTE_MAX_LENGTH}
                rows={2}
                placeholder="Contoh: sambal dipisah, tanpa gula"
                className="mt-2 w-full resize-none rounded-xl border border-gold/25 bg-cream px-4 py-3 text-sm text-brown-deep placeholder:text-brown/40 focus:border-gold"
              />
              <p className="mt-1 text-right text-xs tabular-nums text-brown/50">
                {note.length}/{NOTE_MAX_LENGTH}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-brown-deep">Jumlah</span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                label="Jumlah pesanan"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-gold/20 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!isVariantValid}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              <ShoppingBag
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
              {ctaTotal === null
                ? "Pilih ukuran dahulu"
                : `Tambah ke Keranjang — ${formatRupiah(ctaTotal)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
