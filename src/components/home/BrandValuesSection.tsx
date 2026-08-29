import type { LucideIcon } from "lucide-react";
import { CreditCard, Flame, Home, Leaf } from "lucide-react";

import { Card } from "@/components/ui";

interface BrandValue {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const brandValues: BrandValue[] = [
  {
    title: "Dapur Rumahan",
    description: "Dimasak sendiri dengan rasa rumah yang hangat dan konsisten.",
    Icon: Home,
  },
  {
    title: "Bahan Segar",
    description: "Buah dan ayam dipilih untuk setiap sajian yang kami siapkan.",
    Icon: Leaf,
  },
  {
    title: "Sambal Racikan",
    description: "Sambal taichan racikan sendiri dengan rasa pedas yang khas.",
    Icon: Flame,
  },
  {
    title: "Bayar Mudah",
    description: "Pilih metode pembayaran yang sedang tersedia saat checkout.",
    Icon: CreditCard,
  },
];

export function BrandValuesSection() {
  return (
    <section className="bg-cream-soft py-12 md:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Kenapa MAU&apos;S Kitchen
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-brown-deep md:text-4xl">
            Sederhana, segar, dan dibuat sepenuh hati
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brandValues.map((value) => (
            <Card as="article" key={value.title} className="p-5">
              <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                <value.Icon
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.75}
                />
              </span>
              <h3 className="mt-5 text-lg font-bold text-brown-deep">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-brown/70">
                {value.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
