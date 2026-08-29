import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StoreStatusBadge } from "@/components/common/StoreStatusBadge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cream py-10 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Kolom Teks & CTA */}
          <div className="flex flex-col items-start">
            <div className="mb-4 motion-safe:animate-reveal">
              <StoreStatusBadge />
            </div>

            <p
              className="mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-brown motion-safe:animate-reveal"
              style={{ animationDelay: "80ms" }}
            >
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              Homemade with Love
            </p>

            <h1 className="font-serif text-3xl font-bold tracking-tight text-brown-deep sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              Manisnya Bikin Senyum.
              <br className="hidden sm:inline" />
              <span className="text-chili">Pedasnya Bikin Nagih.</span>
            </h1>

            <p
              className="mt-5 max-w-xl text-[15px] leading-relaxed text-brown/85 sm:text-base md:text-lg motion-safe:animate-reveal"
              style={{ animationDelay: "160ms" }}
            >
              Nikmati keseimbangan rasa otentik dari MAU&apos;S Kitchen. Mulai
              dari kelezatan Choco Berry yang manis menyegarkan, hingga
              sengatan Sate Taichan yang menggugah selera. Dibuat dengan
              dedikasi untuk setiap gigitan dan tegukan.
            </p>

            <div
              className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center motion-safe:animate-reveal"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/menu"
                className="btn-press group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1A110B] px-8 text-sm font-semibold text-white shadow-warm transition-all duration-300 hover:bg-[#2E1F16]"
              >
                Pesan Sekarang
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/menu"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-[#D1C7BD] bg-transparent px-8 text-sm font-semibold text-brown-deep transition-all duration-300 hover:border-[#1A110B] hover:bg-white/40"
              >
                Lihat Menu
              </Link>
            </div>
          </div>

          {/* Kolom Foto Hero (Framed Card) */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#EAE3DB] bg-white shadow-warm-lg sm:aspect-[4/3] lg:aspect-[4/3]">
              <Image
                src="/assets/stitch/hero-food-plate.jpg"
                alt="Sajian Sate Taichan dan minuman ChocoBerry dari MAU'S Kitchen"
                fill
                loading="eager"
                fetchPriority="high"
                quality={75}
                sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 64px), (max-width: 1263px) calc((100vw - 120px) / 2), 572px"
                className="object-cover motion-safe:animate-kenburns"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
