import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, Home, UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-content flex-col items-center px-4 pb-16 pt-16 text-center md:px-8 md:pt-24">
      <ChefHat
        aria-hidden="true"
        className="size-16 text-gold"
        strokeWidth={1.25}
      />
      <h1 className="mt-6 font-serif text-3xl font-bold text-brown-deep md:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-brown/75">
        Alamat yang kamu buka tidak ada atau sudah dipindah. Coba balik ke
        beranda atau langsung lihat menu kami ya.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
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
    </main>
  );
}
