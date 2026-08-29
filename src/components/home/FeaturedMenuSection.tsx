import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { FeaturedMenuGrid } from "@/components/home/FeaturedMenuGrid";
import { getCachedMenu } from "@/lib/menu-data";
import type { MenuItem } from "@/types/menu";

const FEATURED_IDS = ["taichan-daging", "choco-berry-original", "aren-latte"];

export async function FeaturedMenuSection() {
  const loaded = await getCachedMenu();

  // Ambil 3 item spesifik sesuai desain Google Stitch
  const targetedItems: MenuItem[] = [];
  for (const id of FEATURED_IDS) {
    const found = loaded.items.find((item) => item.id === id);
    if (found) {
      targetedItems.push(found);
    }
  }

  // Fallback ke item best seller lain jika salah satu ID tidak ditemukan
  const items =
    targetedItems.length === 3
      ? targetedItems
      : loaded.items.filter((item) => item.isBestSeller && !item.isAddOnItem).slice(0, 3);

  return (
    <section className="bg-cream py-14 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        {/* Header Seksi */}
        <Reveal className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brown">
              Paling Dicari
            </p>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-brown-deep sm:text-3xl lg:text-4xl">
              Menu Pilihan
            </h2>
          </div>
          <Link
            href="/menu"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
          >
            <span>Lihat Semua Menu</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </Reveal>

        {/* Grid 3 Kartu Menu */}
        <FeaturedMenuGrid items={items} />
      </div>
    </section>
  );
}
