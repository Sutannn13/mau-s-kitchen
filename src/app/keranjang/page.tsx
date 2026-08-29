"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmButton, Skeleton } from "@/components/ui";
import { useCart, useCartHydrated, useRehydrateCart } from "@/lib/cart-store";
import { cartSubtotal } from "@/lib/pricing";

export default function KeranjangPage() {
  useRehydrateCart();
  const items = useCart((state) => state.items);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const clear = useCart((state) => state.clear);

  const isReady = useCartHydrated();

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartSubtotal(items);

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-6 pt-6 md:px-8 md:pb-16 md:pt-12">
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
          <ConfirmButton
            onConfirm={clear}
            label={
              <>
                <Trash2
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
                Kosongkan keranjang
              </>
            }
            confirmLabel="Ya, Kosongkan"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-brown/70 transition-colors hover:bg-chili/10 hover:text-chili"
          />
        )}
      </div>

      {!isReady ? (
        <div className="mt-8 space-y-4" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        // Kondisi kosong sesuai docs/08_UI_UX_SPEC.md §8.9 (EmptyState bersama).
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag className="size-9" strokeWidth={1.5} />}
          title="Keranjang kamu masih kosong"
          description="Yuk pilih menu favoritmu!"
          action={
            <Link
              href="/menu"
              className="btn-press inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
            >
              Lihat Menu
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
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
            </AnimatePresence>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary subtotal={subtotal} />
          </div>
        </div>
      )}
    </main>
  );
}
