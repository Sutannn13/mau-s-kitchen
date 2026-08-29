"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleOff, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";

import { QuantityStepper } from "@/components/common/QuantityStepper";
import { Toast } from "@/components/common/Toast";
import { useCartFly } from "@/components/cart/CartFlyContext";
import { formatRupiah } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { lineSubtotal } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { MenuItem, ProductSelection } from "@/types/menu";

interface ProductDetailClientProps {
  item: MenuItem;
  relatedItems: readonly MenuItem[];
}

const NOTE_MAX_LENGTH = 200;

// Penghubung cross-sell: item yang bisa diplih ukuran dulu (punya varian)
// diarahkan ke halaman detailnya, bukan ditambah langsung.
function canQuickAdd(related: MenuItem): boolean {
  return related.variants.length === 0 && related.available;
}

export function ProductDetailClient({
  item,
  relatedItems,
}: ProductDetailClientProps) {
  const radioGroupName = useId();
  const noteId = useId();

  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastIdRef = useRef(0);

  const addItem = useCart((state) => state.addItem);

  const requiresVariant = item.variants.length > 0;
  const selectedVariant =
    item.variants.find((variant) => variant.id === variantId) ?? null;
  const isVariantValid = !requiresVariant || selectedVariant !== null;
  const selectedAddOns = item.addOns.filter((addOn) =>
    selectedAddOnIds.has(addOn.id),
  );
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

  function showToast(message: string): void {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message });
  }

  const { flyFromElement } = useCartFly();

  function handleAdd(event?: React.MouseEvent<HTMLButtonElement>): void {
    if (!isVariantValid) {
      return;
    }
    if (event?.currentTarget) {
      flyFromElement(event.currentTarget, item.image);
    }
    const selection: ProductSelection = {
      variant: selectedVariant,
      addOns: selectedAddOns,
      quantity,
      note: note.trim(),
    };
    addItem(item, selection);
    const variantLabel = selection.variant ? ` (${selection.variant.name})` : "";
    showToast(`${item.name}${variantLabel} ditambahkan ke keranjang`);
  }

  function handleQuickAdd(related: MenuItem, source?: Element): void {
    if (source) {
      flyFromElement(source, related.image);
    }
    addItem(related, { variant: null, addOns: [], quantity: 1, note: "" });
    showToast(`${related.name} ditambahkan ke keranjang`);
  }

  const optionRowClass = (checked: boolean): string =>
    cn(
      "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-5 py-3 transition-all duration-200",
      checked
        ? "border-gold bg-gold/10 shadow-warm"
        : "border-gold/20 bg-cream hover:border-gold/40 hover:bg-gold/5",
    );

  return (
    <>
      <div className="space-y-6">
        {requiresVariant && (
          <section className="rounded-2xl border border-gold/20 bg-cream-soft p-5">
            <fieldset className="border-0 p-0">
              <legend className="text-sm font-bold text-brown-deep">
                Pilih Ukuran{" "}
                <span aria-hidden="true" className="text-chili">
                  *
                </span>
                <span className="sr-only">(wajib memilih satu)</span>
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
          </section>
        )}

        {item.addOns.length > 0 && (
          <section className="rounded-2xl border border-gold/20 bg-cream-soft p-5">
            <fieldset className="border-0 p-0">
              <legend className="text-sm font-bold text-brown-deep">
                Tambahan
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
          </section>
        )}

        <div className="rounded-2xl border border-gold/20 bg-cream-soft p-5">
          <label htmlFor={noteId} className="text-sm font-bold text-brown-deep">
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
            className="mt-2 w-full resize-none rounded-xl border border-gold/25 bg-cream px-4 py-3 text-sm text-brown-deep placeholder:text-brown/40 focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-right text-xs tabular-nums text-brown/50">
            {note.length}/{NOTE_MAX_LENGTH}
          </p>
        </div>
      </div>

      {relatedItems.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-brown-deep">
            <UtensilsCrossed aria-hidden="true" className="size-5 text-gold" strokeWidth={1.75} />
            Lengkapi Pesananmu
          </h2>
          <p className="mt-1 text-sm text-brown/70">
            Pilih pendamping yang pas untuk {item.name}.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {relatedItems.map((related) => (
              <li
                key={related.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-cream-soft shadow-warm"
              >
                <Link
                  href={`/produk/${related.id}`}
                  aria-label={`Lihat detail ${related.name}`}
                  className="relative aspect-square overflow-hidden bg-cream"
                >
                  <Image
                    src={related.image}
                    alt={`Poster resmi yang menampilkan ${related.name}`}
                    fill
                    quality={60}
                    sizes="(max-width: 479px) 46vw, (max-width: 1023px) 31vw, 23vw"
                    className={cn(
                      "object-cover transition-transform duration-300 motion-safe:hover:scale-105",
                      !related.available && "grayscale",
                    )}
                  />
                  {!related.available && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/50">
                      <span className="flex min-h-9 items-center gap-1 rounded-full bg-cream px-3 text-xs font-bold text-brown-deep">
                        <CircleOff aria-hidden="true" className="size-3.5 text-chili" strokeWidth={2} />
                        Habis
                      </span>
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link
                    href={`/produk/${related.id}`}
                    className="line-clamp-1 text-sm font-semibold text-brown-deep transition-colors hover:text-brown"
                  >
                    {related.name}
                  </Link>
                  <p className="text-sm font-bold tabular-nums text-gold">
                    {formatRupiah(related.basePrice)}
                  </p>
                  {canQuickAdd(related) ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        handleQuickAdd(related, event.currentTarget);
                      }}
                      className="mt-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-brown-deep px-3 text-xs font-bold text-cream transition-colors hover:bg-brown"
                    >
                      <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
                      Tambah
                    </button>
                  ) : (
                    <Link
                      href={`/produk/${related.id}`}
                      className="mt-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-gold/40 bg-cream px-3 text-xs font-bold text-brown-deep transition-colors hover:border-gold hover:bg-gold/10"
                    >
                      Pilih
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.available ? (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-sticky md:bottom-6">
          <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
            <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-cream/95 p-3 shadow-warm-lg backdrop-blur-xl">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                label="Jumlah pesanan"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!isVariantValid}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <ShoppingBag aria-hidden="true" className="size-4" strokeWidth={2} />
                {ctaTotal === null
                  ? "Pilih ukuran dahulu"
                  : `Tambah — ${formatRupiah(ctaTotal)}`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <p className="inline-flex min-h-11 items-center gap-2 rounded-full bg-neutral-200 px-5 text-sm font-bold text-neutral-500">
            <CircleOff aria-hidden="true" className="size-4" strokeWidth={2} />
            Habis — cek lagi nanti ya
          </p>
        </div>
      )}

      {toast !== null && (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={() => {
            setToast(null);
          }}
        />
      )}
    </>
  );
}
