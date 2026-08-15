"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { useCart, useRehydrateCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import { cartSubtotal } from "@/lib/pricing";

export default function CheckoutPage() {
  useRehydrateCart();
  const router = useRouter();
  const items = useCart((state) => state.items);
  // Setelah pesanan sukses, keranjang dikosongkan — jangan sampai efek
  // redirect "keranjang kosong" menimpa navigasi ke halaman pembayaran.
  const [hasSubmittedOrder, setSubmittedOrder] = useState(false);

  const [isReady, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  // Keranjang kosong → redirect ke menu (docs/16_TESTING_QA.md E2E-09).
  useEffect(() => {
    if (isReady && items.length === 0 && !hasSubmittedOrder) {
      router.replace("/menu");
    }
  }, [isReady, items.length, hasSubmittedOrder, router]);

  const subtotal = cartSubtotal(items);

  if (!isReady || items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <h1 className="font-serif text-3xl font-bold text-brown-deep">
          Checkout
        </h1>
        <p className="mt-4 text-brown/70">Memuat data pesanan…</p>
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
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
      <h1 className="font-serif text-3xl font-bold text-brown-deep">Checkout</h1>
      <p className="mt-2 text-sm leading-6 text-brown/70">
        Isi data di bawah, lalu pesananmu langsung terkirim ke WhatsApp admin
        MAU&apos;S Kitchen.
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
