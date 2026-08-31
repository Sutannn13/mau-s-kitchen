import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { EyebrowRule } from "@/components/common/EyebrowRule";
import { formatRupiah } from "@/lib/format";
import { getCachedMenu } from "@/lib/menu-data";

export async function ChocoBerryHighlight() {
  const loaded = await getCachedMenu();
  const category = loaded.categories.find((entry) => entry.id === "chocoberry");
  const featuredItem = loaded.items.find(
    (item) => item.categoryId === "chocoberry" && item.isBestSeller,
  );
  const featuredAddOn = featuredItem?.addOns[0];

  if (!category || !featuredItem) {
    return null;
  }

  return (
    <section className="bg-choco py-10 text-cream md:py-16">
      <div className="scroll-reveal mx-auto grid w-full max-w-content gap-8 px-4 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
        <div className="relative">
          <span className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-gold/30" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-gold/30 shadow-warm-lg">
          <Image
            src="/assets/stitch/chocoberry-original-optimized.jpg"
            alt="Poster resmi ChocoBerry dengan buah segar dan coklat premium"
            fill
            unoptimized
            quality={70}
            sizes="(max-width: 767px) 100vw, 45vw"
            className="object-cover"
          />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pistachio/40 bg-pistachio/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-pistachio">
              Sub-brand
            </span>
          </div>
          <p className="mt-4 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
            <EyebrowRule variant="light" />
            <Sparkles aria-hidden="true" className="size-4" />
            ChocoBerry by MAU&apos;S Kitchen
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-tight md:text-5xl">
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
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep transition-colors motion-safe:hover:-translate-y-0.5 hover:bg-gold-light"
          >
            Pilih ChocoBerry
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
