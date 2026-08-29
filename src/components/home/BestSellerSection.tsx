import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { formatRupiah } from "@/lib/format";
import { getCachedMenu } from "@/lib/menu-data";

export async function BestSellerSection() {
  const loaded = await getCachedMenu();
  const bestSellers = loaded.items
    .filter((item) => item.isBestSeller && !item.isAddOnItem)
    .slice(0, 6);

  return (
    <section className="bg-cream py-12 md:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              Pilihan favorit
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-brown-deep md:text-4xl">
              Sering jadi pilihan pelanggan
            </h2>
          </div>
          <Link
            href="/menu"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full text-sm font-bold text-brown hover:text-brown-deep"
          >
            Lihat semua menu
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="-mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
          {bestSellers.map((item) => (
            <article
              key={item.id}
              className="group min-w-[82vw] snap-center overflow-hidden rounded-2xl border border-gold/20 bg-cream-soft shadow-warm sm:min-w-0"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={item.image}
                  alt={"Poster resmi yang menampilkan " + item.name}
                  fill
                  quality={70}
                  sizes="(max-width: 479px) 82vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover transition duration-300 motion-safe:group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-cream/95 px-3 text-xs font-bold text-brown-deep shadow-warm">
                  <Star
                    aria-hidden="true"
                    className="size-4 fill-gold text-gold"
                    strokeWidth={1.75}
                  />
                  Favorit
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-brown-deep">{item.name}</h3>
                <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-brown/70">
                  {item.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="font-bold tabular-nums text-gold">
                    {item.variants.length > 0 && (
                      <span className="mr-1 text-xs font-semibold text-brown/60">
                        Mulai
                      </span>
                    )}
                    {formatRupiah(item.basePrice)}
                  </p>
                  <Link
                    href={"/produk/" + item.id}
                    className="inline-flex min-h-11 items-center rounded-full bg-brown-deep px-4 text-xs font-bold text-cream transition-colors hover:bg-brown"
                  >
                    Lihat
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
