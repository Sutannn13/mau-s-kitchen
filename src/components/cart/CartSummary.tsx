"use client";

import Link from "next/link";

import { formatRupiah } from "@/lib/format";

interface CartSummaryProps {
  subtotal: number;
}

// Ongkir Fase 1 selalu dikonfirmasi admin (BR-05), bukan Rp0.
// Lihat docs/10_DATA_MODEL.md §10.5 dan docs/08_UI_UX_SPEC.md §8.4.
export function CartSummary({ subtotal }: CartSummaryProps) {
  return (
    <aside className="rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
      <h2 className="text-lg font-bold text-brown-deep">Ringkasan</h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-brown/80">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-brown-deep">
            {formatRupiah(subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-brown/80">Ongkir</dt>
          <dd className="font-semibold text-brown/70">dikonfirmasi admin</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gold/20 pt-3">
          <dt className="font-bold text-brown-deep">TOTAL</dt>
          <dd className="text-xl font-bold tabular-nums text-brown-deep">
            {formatRupiah(subtotal)}
          </dd>
        </div>
      </dl>

      <Link
        href="/checkout"
        className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
      >
        Lanjut Buat Pesanan
      </Link>
      <Link
        href="/menu"
        className="mt-2 flex min-h-11 items-center justify-center rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
      >
        + Tambah Menu Lain
      </Link>

      <p className="mt-4 text-center text-xs leading-5 text-brown/60">
        Total final akan dikonfirmasi admin lewat WhatsApp bersama ongkir.
      </p>
    </aside>
  );
}
