"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Skeleton } from "@/components/ui";
import { useCart, useCartHydrated, useRehydrateCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import { cartSubtotal } from "@/lib/pricing";

export default function CheckoutPage() {
  useRehydrateCart();
  const router = useRouter();
  const items = useCart((state) => state.items);
  // Setelah pesanan sukses, keranjang dikosongkan — jangan sampai efek
  // redirect "keranjang kosong" menimpa navigasi ke halaman pembayaran.
  const [hasSubmittedOrder, setSubmittedOrder] = useState(false);

  const isReady = useCartHydrated();

  // Keranjang kosong → redirect ke menu (docs/16_TESTING_QA.md E2E-09).
  useEffect(() => {
    if (isReady && items.length === 0 && !hasSubmittedOrder) {
      router.replace("/menu");
    }
  }, [isReady, items.length, hasSubmittedOrder, router]);

  const subtotal = cartSubtotal(items);

  if (!isReady || items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-content px-4 pb-6 pt-6 md:px-8 md:pb-16 md:pt-12">
        <h1 className="font-serif text-3xl font-bold text-brown-deep">
          Buat Pesanan
        </h1>
        <p className="sr-only">Memuat data pesanan…</p>
        {/* Skeleton cermin struktur form (docs/08 §8.9 — A7). */}
        <div className="mt-8 space-y-4" aria-hidden="true">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-12 rounded-full" />
        </div>
      </main>
    );
  }

  const orderSummary = (
    <div className="rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
      <h2 className="text-lg font-bold text-brown-deep">Ringkasan Pesanan</h2>
      <ul className="mt-4 divide-y divide-gold/15">
        {items.map((item) => (
          <li key={item.lineId} className="flex justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block font-semibold text-brown-deep">
                {item.name}
                {item.variantName ? ` (${item.variantName})` : ""}
              </span>
              <span className="block text-xs text-brown/60">
                {item.quantity} × {formatRupiah(item.unitPrice)}
                {item.addOns.length > 0
                  ? ` + ${item.addOns.map((addOn) => addOn.name).join(", ")}`
                  : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-gold/20 pt-3 text-sm">
        <span className="font-bold text-brown-deep">Subtotal</span>
        <span className="text-lg font-bold tabular-nums text-brown-deep">
          {formatRupiah(subtotal)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-brown/60">
        Ongkir dikonfirmasi admin. Total final diberitahu lewat WhatsApp.
      </p>
      <Link
        href="/keranjang"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brown underline underline-offset-4 transition-colors hover:text-brown-deep"
      >
        Ubah keranjang
      </Link>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-6 pt-6 md:px-8 md:pb-16 md:pt-12">
      <h1 className="font-serif text-3xl font-bold text-brown-deep">Buat Pesanan</h1>
      <p className="mt-2 text-sm leading-6 text-brown/70">
        Isi data di bawah. Pesananmu akan langsung tercatat dan kamu lanjut ke
        langkah pembayaran berikutnya.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          subtotal={subtotal}
          onOrderCreated={() => {
            setSubmittedOrder(true);
          }}
        />

        {/* Accordion di mobile, sticky di desktop (docs/08_UI_UX_SPEC.md §8.5). */}
        <div className="lg:hidden">
          <details className="rounded-2xl border border-gold/20 bg-cream-soft">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-bold text-brown-deep [&::-webkit-details-marker]:hidden">
              Lihat Ringkasan Pesanan
              <span className="font-bold tabular-nums text-gold">
                {formatRupiah(subtotal)}
              </span>
            </summary>
            <div className="px-3 pb-3">{orderSummary}</div>
          </details>
        </div>
        <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          {orderSummary}
        </div>
      </div>
    </main>
  );
}
