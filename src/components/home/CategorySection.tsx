import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Coffee, Flame, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { getCategoryStartingPrice, menu } from "@/lib/menu";
import type { CategoryId } from "@/types/menu";

interface CategoryVisual {
  Icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
  label: string;
}

const categoryVisuals: Record<CategoryId, CategoryVisual> = {
  taichan: {
    Icon: Flame,
    cardClassName: "bg-ink text-white",
    iconClassName: "bg-chili text-white",
    label: "Pedas & gurih",
  },
  minuman: {
    Icon: Coffee,
    cardClassName: "bg-ink-soft text-white",
    iconClassName: "bg-flame text-ink",
    label: "Segar & creamy",
  },
  chocoberry: {
    Icon: Heart,
    cardClassName: "bg-choco text-cream",
    iconClassName: "bg-berry text-white",
    label: "Manis & premium",
  },
};

export function CategorySection() {
  const categories = [...menu.categories].sort((a, b) => a.order - b.order);

  return (
    <section className="bg-cream-soft py-12 md:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Tiga pilihan, satu dapur
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-brown-deep md:text-4xl">
            Lagi ingin makan apa?
          </h2>
          <p className="mt-3 text-sm leading-6 text-brown/75 md:text-base">
            Dari taichan yang nampol sampai dessert coklat yang lembut, semuanya
            bisa kamu pilih dalam satu pesanan.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {categories.map((category) => {
            const visual = categoryVisuals[category.id];
            const startingPrice = getCategoryStartingPrice(category.id);

            return (
              <article
                key={category.id}
                className={
                  "group overflow-hidden rounded-2xl shadow-warm transition duration-200 hover:-translate-y-1 hover:shadow-warm-lg " +
                  visual.cardClassName
                }
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={"Poster resmi kategori " + category.name + " MAU'S Kitchen"}
                    fill
                    quality={70}
                    sizes="(max-width: 1023px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <span
                    className={
                      "absolute left-4 top-4 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-bold " +
                      visual.iconClassName
                    }
                  >
                    <visual.Icon
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.75}
                    />
                    {visual.label}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-70">
                    Mulai {formatRupiah(startingPrice)}
                  </p>
                  <h3
                    className={
                      category.id === "chocoberry"
                        ? "mt-2 font-serif text-2xl font-bold"
                        : "mt-2 font-display text-3xl tracking-wide"
                    }
                  >
                    {category.name}
                  </h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 opacity-75">
                    {category.tagline}
                  </p>
                  <Link
                    href={"/menu/" + category.id}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-current/30 px-4 text-sm font-bold transition-colors hover:bg-white/10"
                  >
                    Lihat Pilihan
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
