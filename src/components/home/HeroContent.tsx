import Image from "next/image";
import { ArrowDown, ArrowRight, Flame, Sparkles } from "lucide-react";
import Link from "next/link";

import { StoreStatusBadge } from "@/components/common/StoreStatusBadge";
import { EyebrowRule } from "@/components/common/EyebrowRule";
import { AmbientBackground } from "@/components/common/AmbientBackground";

export function HeroContent() {
  return (
    <section
      className="relative overflow-hidden bg-cream pb-12 pt-5 md:pb-20 md:pt-10"
    >
      <AmbientBackground
        tone="warm"
      />

      <div className="relative mx-auto w-full max-w-content px-4 md:px-8">
        <div className="relative scroll-reveal rounded-[2rem] border border-brown-deep/10 bg-cream-soft/80 p-4 shadow-[0_18px_50px_rgba(62,35,24,0.10)] backdrop-blur-sm md:grid md:grid-cols-[0.95fr_1.05fr] md:items-center md:gap-6 md:p-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:p-9">
          {/* Frame dekoratif lapis kedua — inset ring gold agar tidak
              menonjol keluar container di mobile (fix border overflow). */}
          <span className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-gold/30" />

          <div className="flex flex-col items-start px-1 pb-6 pt-1 md:px-2 lg:pb-0">
            <div className="scroll-reveal mb-5 flex w-full items-center justify-between gap-3">
              <StoreStatusBadge />
              <span className="text-xs font-bold tabular-nums text-gold">
                01 / 03
              </span>
            </div>

            <p
              className="scroll-reveal mb-4 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brown"
              style={{ animationDelay: "80ms" }}
            >
              <EyebrowRule />
              Homemade with Love
            </p>

            <h1 className="scroll-reveal font-serif text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-brown-deep sm:text-5xl md:text-[2.5rem] lg:text-[4rem] lg:leading-[1.02]"
              style={{ animationDelay: "120ms" }}
            >
              Manisnya Bikin Senyum.{" "}
              <br className="hidden sm:inline" />
              <span className="text-chili">Pedasnya Bikin Nagih.</span>
            </h1>

            <p
              className="scroll-reveal mt-5 max-w-xl text-[15px] leading-7 text-brown/80 md:text-base"
              style={{ animationDelay: "200ms" }}
            >
              Nikmati keseimbangan rasa otentik dari MAU&apos;S Kitchen. Mulai
              dari kelezatan Choco Berry yang manis menyegarkan, hingga sengatan
              Sate Taichan yang menggugah selera. Dibuat dengan dedikasi untuk
              setiap gigitan dan tegukan.
            </p>

            <div
              className="scroll-reveal mt-7 flex w-full items-center gap-2.5 sm:w-auto"
              style={{ animationDelay: "280ms" }}
            >
              <Link
                href="#menu-home"
                className="btn-press shimmer-sweep group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brown-deep px-6 text-sm font-bold text-white shadow-warm transition-colors hover:bg-brown sm:flex-none"
              >
                Lihat Pilihan
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/menu"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-[#D1C7BD] bg-transparent px-8 text-sm font-semibold text-brown-deep transition-all duration-300 hover:border-[#1A110B] hover:bg-white/40"
              >
                Jelajahi Menu
              </Link>
            </div>

            <div className="scroll-reveal mt-6 flex flex-wrap gap-2 border-t border-dashed border-gold/35 pt-5 text-[11px] font-bold text-brown/70"
              style={{ animationDelay: "360ms" }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-chili/10 px-3 py-2 text-chili">
                <Flame aria-hidden="true" className="size-3.5" />
                Taichan
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-2 text-brown-deep">
                <Sparkles aria-hidden="true" className="size-3.5" />
                ChocoBerry
              </span>
            </div>
          </div>

          <div className="scroll-reveal relative" style={{ animationDelay: "160ms" }}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.6rem] border border-white/60 bg-white shadow-warm-lg lg:aspect-[6/5]">
              <div className="absolute inset-0">
                <Image
                  src="/assets/stitch/hero-food-plate-optimized.jpg"
                  alt="Sajian dari MAU'S Kitchen"
                  fill
                  unoptimized
                  loading="eager"
                  fetchPriority="high"
                  quality={75}
                  sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 64px), (max-width: 1263px) calc((100vw - 120px) / 2), 572px"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-14 text-white md:px-5 md:pb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-light">
                  Dibuat setelah kamu pesan
                </p>
                <p className="mt-1 text-sm font-semibold md:text-base">
                  Dari dapur rumahan, langsung untuk kamu.
                </p>
              </div>
            </div>
            <a
              href="#menu-home"
              aria-label="Lanjut ke pilihan menu"
              className="btn-press absolute -bottom-5 right-5 z-10 flex size-12 items-center justify-center rounded-full border-4 border-cream-soft bg-gold text-brown-deep shadow-warm-lg"
            >
              <ArrowDown aria-hidden="true" className="size-5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
