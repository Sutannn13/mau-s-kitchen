import type { Metadata } from "next";
import Link from "next/link";
import { Heart, UtensilsCrossed } from "lucide-react";

import { Card } from "@/components/ui";
import { siteConfig } from "@/config/site";

// Copy dari docs/15_SEO_CONTENT.md §15.4 (Tentang Kami + Kenapa MAU'S Kitchen).
export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "Cerita di balik MAU'S Kitchen, dapur rumahan yang memasak dengan cinta.",
};

interface ValueItem {
  title: string;
  body: string;
}

// Nilai brand dirangkum dari tabel "Kenapa MAU'S Kitchen" docs/15_SEO_CONTENT.md §15.4.
const brandValues: ValueItem[] = [
  {
    title: "Dapur Rumahan",
    body: "Dimasak sendiri, bukan pabrikan. Rasa rumah yang konsisten.",
  },
  {
    title: "Bahan Segar",
    body: "Buah dan ayam dipilih setiap hari, bukan stok lama.",
  },
  {
    title: "Sambal Racikan Sendiri",
    body: "Resep sambal taichan khas yang tidak ada di tempat lain.",
  },
  {
    title: "Bayar Gampang",
    body: "Pilih metode pembayaran yang sedang tersedia saat checkout.",
  },
];

export default function TentangPage() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-6 pt-6 md:px-8 md:pb-16 md:pt-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">
          Tentang Kami
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-brown-deep md:text-4xl">
          Homemade with Love
        </h1>

        <section className="mt-8 space-y-5 text-base leading-8 text-brown-deep/90">
          <p>
            {siteConfig.name} berawal dari dapur kecil di rumah dan satu
            keyakinan sederhana: makanan enak itu soal ketulusan, bukan
            ukuran dapurnya.
          </p>
          <p>
            Kami mulai dari sate taichan dengan sambal racikan sendiri, lalu
            melengkapinya dengan minuman segar dan ChocoBerry — buah segar
            berbalut coklat premium.
          </p>
          <p>
            Setiap pesanan disiapkan hari itu juga. Tidak ada stok semalam,
            tidak ada bahan asal-asalan. Itu janji kami sejak awal:{" "}
            <strong className="font-bold">Homemade with Love</strong>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-brown-deep">
            <UtensilsCrossed
              aria-hidden="true"
              className="size-6 text-gold"
              strokeWidth={1.75}
            />
            Kenapa {siteConfig.name}?
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {brandValues.map((value) => (
              <Card as="li" key={value.title} className="p-5">
                <h3 className="text-sm font-bold text-brown-deep">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-brown/75">
                  {value.body}
                </p>
              </Card>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl bg-ink p-6 text-center md:p-8">
          <Heart
            aria-hidden="true"
            className="mx-auto size-8 text-flame"
            strokeWidth={1.75}
          />
          <p className="mt-3 font-serif text-xl font-bold text-cream md:text-2xl">
            Penasaran rasanya?
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-cream/75">
            Pesanan disiapkan segar di hari yang sama. Lihat menu dan pesan
            kapan saja tanpa perlu akun.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
          >
            Lihat Menu Kami
          </Link>
        </section>
      </div>
    </main>
  );
}
