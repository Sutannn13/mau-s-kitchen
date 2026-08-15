"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";

import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart, useRehydrateCart } from "@/lib/cart-store";
import { cartSubtotal } from "@/lib/pricing";

export default function KeranjangPage() {
  useRehydrateCart();
  const items = useCart((state) => state.items);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const clear = useCart((state) => state.clear);

  // Skeleton singkat sampai localStorage selesai dibaca agar tidak kedip kosong.
  const [isReady, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartSubtotal(items);

  function handleClear(): void {
    if (window.confirm("Kosongkan seluruh keranjang?")) {
      clear();
    }
  }

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold text-brown-deep">
          Keranjang Kamu
          {isReady && items.length > 0 ? (
            <span className="ml-2 align-middle text-base font-semibold text-brown/60">
              ({totalQuantity} item)
            </span>
          ) : null}
        </h1>
        {isReady && items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-brown/70 transition-colors hover:bg-chili/10 hover:text-chili"
          >
            <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Kosongkan keranjang
          </button>
        )}
      </div>

      {!isReady ? (
        <div className="mt-8 space-y-4" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-gold/20 bg-cream-soft"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        // Teks kondisi kosong sesuai docs/08_UI_UX_SPEC.md §8.9.
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-gold/15">
            <ShoppingBag
              aria-hidden="true"
              className="size-9 text-gold"
              strokeWidth={1.5}
            />
          </span>
          <p className="mt-6 max-w-sm text-brown/80">
            Keranjang kamu masih kosong. Yuk pilih menu favoritmu!
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
          >
            Lihat Menu
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItemRow
                key={item.lineId}
                item={item}
                onQuantityChange={(quantity) => {
                  updateQuantity(item.lineId, quantity);
                }}
                onRemove={() => {
                  removeItem(item.lineId);
                }}
              />
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary subtotal={subtotal} />
          </div>
        </div>
      )}
    </main>
  );
}
