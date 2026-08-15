import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { formatRupiah } from "@/lib/format";
import { getCategoryById, menu } from "@/lib/menu";

export function ChocoBerryHighlight() {
  const category = getCategoryById("chocoberry");
  const featuredItem = menu.items.find(
    (item) => item.categoryId === "chocoberry" && item.isBestSeller,
  );
  const featuredAddOn = featuredItem?.addOns[0];

  if (!category || !featuredItem) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-choco to-choco-mid py-12 text-cream md:py-24">
      <div className="mx-auto grid w-full max-w-content gap-8 px-4 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/30 shadow-warm-lg">
          <Image
            src={category.image}
            alt="Poster resmi ChocoBerry dengan buah segar dan coklat premium"
            fill
            quality={70}
            sizes="(max-width: 767px) 100vw, 45vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-light">
            <Sparkles aria-hidden="true" className="size-4" />
            ChocoBerry by MAU&apos;S Kitchen
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold md:text-5xl">
            Fresh Berries, Premium Chocolate
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-cream/75 md:text-base">
            Strawberry, anggur, dan pisang segar dalam cup, disiram coklat
            premium yang lumer. Made with Love, Just for You.
          </p>
          {featuredAddOn && (
            <p className="mt-5 rounded-2xl border border-pistachio/50 bg-pistachio/15 p-4 text-sm leading-6 text-cream">
              Tambahkan {featuredAddOn.name} seharga{" "}
              <strong className="text-gold-light">
                +{formatRupiah(featuredAddOn.price)}
              </strong>{" "}
              untuk sensasi renyah dan gurih.
            </p>
          )}
          <Link
            href="/menu/chocoberry"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep transition-transform hover:-translate-y-0.5 hover:bg-gold-light"
          >
            Pilih ChocoBerry
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
