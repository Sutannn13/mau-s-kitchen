import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Home, KeyRound, UtensilsCrossed } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { OrderAccessRecovery } from "@/components/order/OrderAccessRecovery";

export const metadata: Metadata = {
  title: "Pesanan Tidak Ditemukan",
  robots: { index: false, follow: false },
};

// 404 khusus rute pesanan (docs/04 §4.4): tautan privat yang tidak
// lengkap/tidak cocok tidak boleh bocorkan apa pun, tapi tetap diberi
// jalan pulih lewat riwayat perangkat + chat admin.
export default function PesananNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-content flex-col items-center px-4 pb-16 pt-16 md:px-8 md:pt-24">
      <EmptyState
        headingLevel="h1"
        icon={<KeyRound className="size-7" strokeWidth={1.5} />}
        title="Tautan pesanan tidak bisa dibuka"
        description="Setiap pesanan dijaga dengan tautan privat — bagian ?token= di alamat ini hilang atau tidak cocok. Kami coba cari pesananmu di perangkat ini dulu ya."
        action={
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/menu"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
            >
              <UtensilsCrossed
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.75}
              />
              Lihat Menu
            </Link>
            <Link
              href="/"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
            >
              <Home aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Kembali ke Beranda
            </Link>
          </div>
        }
      />
      <Suspense fallback={null}>
        <OrderAccessRecovery />
      </Suspense>
    </main>
  );
}
