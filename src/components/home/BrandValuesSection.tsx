import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { CreditCard, Flame, Home, Leaf } from "lucide-react";

import { EyebrowRule } from "@/components/common/EyebrowRule";
import { Card } from "@/components/ui";

interface BrandValue {
  title: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
}

const brandValues: BrandValue[] = [
  {
    title: "Dapur Rumahan",
    description: "Dimasak sendiri dengan rasa rumah yang hangat dan konsisten.",
    Icon: Home,
    accent: "from-gold to-gold-light",
  },
  {
    title: "Bahan Segar",
    description: "Buah dan ayam dipilih untuk setiap sajian yang kami siapkan.",
    Icon: Leaf,
    accent: "from-pistachio to-success",
  },
  {
    title: "Sambal Racikan",
    description: "Sambal taichan racikan sendiri dengan rasa pedas yang khas.",
    Icon: Flame,
    accent: "from-chili to-rose",
  },
  {
    title: "Bayar Mudah",
    description: "Pilih metode pembayaran yang sedang tersedia saat checkout.",
    Icon: CreditCard,
    accent: "from-berry to-chili",
  },
];

export function BrandValuesSection() {
  return (
    <section className="relative overflow-hidden py-8 text-cream md:py-14">
      {/* Satu background terkompresi. Slideshow empat foto dihapus karena
          menambah >3 MB pada cold load tanpa menambah informasi. */}
      <Image
        src="/assets/stitch/hero-food-plate-optimized.jpg"
        alt=""
        fill
        unoptimized
        sizes="100vw"
        className="object-cover blur-[1px] brightness-[0.45]"
      />
      {/* Overlay gelap gradient untuk readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-brown-deep/70 via-brown-deep/60 to-brown-deep/80" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-content px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-2 flex items-center justify-center gap-2.5">
            <EyebrowRule variant="light" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
              Kenapa MAU&apos;S Kitchen
            </p>
            <EyebrowRule variant="light" />
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold text-cream md:text-4xl">
            Sederhana, segar, dan dibuat sepenuh hati
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 scroll-reveal-stagger lg:grid-cols-4">
          {brandValues.map((value) => (
            <Card
              as="article"
              key={value.title}
              muted
              className="scroll-reveal glow-hover relative min-w-0 overflow-hidden border-cream/15 bg-white/[0.08] p-4 backdrop-blur-md hover:bg-white/[0.12] sm:p-5"
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${value.accent}`} aria-hidden="true" />
              <span className="mt-1 flex size-11 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold-light">
                <value.Icon
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.75}
                />
              </span>
              <h3 className="mt-4 text-base font-bold text-cream sm:text-lg">
                {value.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-cream/75 sm:text-sm sm:leading-6">
                {value.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
