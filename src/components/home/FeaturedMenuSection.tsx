import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { FeaturedMenuGrid } from "@/components/home/FeaturedMenuGrid";
import { getCachedMenu } from "@/lib/menu-data";

export async function FeaturedMenuSection() {
  const loaded = await getCachedMenu();
  const categories = [...loaded.categories].sort((a, b) => a.order - b.order);
  const items = loaded.items.filter((item) => !item.isAddOnItem);

  return (
    <section id="menu-home" className="bg-cream-soft py-10 md:py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <Reveal className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="h-px w-8 bg-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
                Menu hari ini
              </p>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brown-deep md:text-5xl">
              Pilih yang kamu mau
            </h2>
            <p className="mt-3 hidden max-w-xl text-sm leading-6 text-brown/75 sm:block md:text-base">
              Cari menu, pilih kategori, lalu tambah langsung ke keranjang.
            </p>
          </div>
          <Link
            href="/menu"
            className="btn-press group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-brown-deep/20 bg-cream px-4 text-xs font-bold text-brown-deep transition-colors hover:border-brown-deep/40 hover:bg-brown-deep hover:text-cream md:px-5 md:text-sm"
          >
            <span className="hidden xs:inline">Menu lengkap</span>
            <span className="xs:hidden">Semua</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </Reveal>

        <FeaturedMenuGrid categories={categories} items={items} />
      </div>
    </section>
  );
}
