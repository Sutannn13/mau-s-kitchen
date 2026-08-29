import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, Home, UtensilsCrossed } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  robots: { index: false, follow: false },
};

// 404 hangat dengan EmptyState bersama (docs/08 §8.9: ilustrasi + tombol
// kembali ke Menu) — upgrade Batch 4.
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-16 md:px-8 md:pt-24">
      <EmptyState
        headingLevel="h1"
        icon={<ChefHat className="size-9" strokeWidth={1.25} />}
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu buka tidak ada atau sudah dipindah. Coba balik ke beranda atau langsung lihat menu kami ya."
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
    </main>
  );
}
