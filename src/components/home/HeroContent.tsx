"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type Variants } from "motion/react";
import { ArrowDown, ArrowRight, Flame, Sparkles } from "lucide-react";
import Link from "next/link";

import { StoreStatusBadge } from "@/components/common/StoreStatusBadge";

// Heading dipisah per kata untuk stagger reveal yang lebih dinamis
const headingLine1 = "Manisnya Bikin Senyum.".split(" ");
const headingLine2 = "Pedasnya Bikin Nagih.".split(" ");

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.045,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

export function HeroContent() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax hanya pada layer foto agar frame dan layout tidak ikut bergeser.
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-cream pb-12 pt-5 md:pb-20 md:pt-10"
    >
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="relative rounded-[2rem] border border-brown-deep/10 bg-cream-soft p-4 shadow-[0_18px_50px_rgba(62,35,24,0.10)] md:p-7 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:p-9">
          <span className="pointer-events-none absolute -bottom-2 -right-2 -z-10 h-full w-full rounded-[2rem] border border-gold/40" />

          <div className="flex flex-col items-start px-1 pb-6 pt-1 md:px-2 lg:pb-0">
            <div className="mb-5 flex w-full items-center justify-between gap-3 motion-safe:animate-reveal">
              <StoreStatusBadge />
              <span className="text-xs font-bold tabular-nums text-gold">
                01 / 03
              </span>
            </div>

            <p
              className="mb-4 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brown motion-safe:animate-reveal"
              style={{ animationDelay: "80ms" }}
            >
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              Homemade with Love
            </p>

            <h1 className="font-serif text-[2.35rem] font-bold leading-[1.04] tracking-[-0.035em] text-brown-deep sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
              {headingLine1.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                >
                  {word}{" "}
                </motion.span>
              ))}
              <br className="hidden sm:inline" />
              {headingLine2.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  custom={i + headingLine1.length}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block text-chili"
                >
                  {word}{" "}
                </motion.span>
              ))}
            </h1>

            <p
              className="mt-5 max-w-xl text-[15px] leading-7 text-brown/80 md:text-base motion-safe:animate-reveal"
              style={{ animationDelay: "160ms" }}
            >
              Nikmati keseimbangan rasa otentik dari MAU&apos;S Kitchen. Mulai
              dari kelezatan Choco Berry yang manis menyegarkan, hingga sengatan
              Sate Taichan yang menggugah selera. Dibuat dengan dedikasi untuk
              setiap gigitan dan tegukan.
            </p>

            <div
              className="mt-7 flex w-full items-center gap-2.5 sm:w-auto motion-safe:animate-reveal"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="#menu-home"
                className="btn-press group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brown-deep px-6 text-sm font-bold text-white shadow-warm transition-colors hover:bg-brown sm:flex-none"
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
                Jelajahi Menu
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-dashed border-gold/35 pt-5 text-[11px] font-bold text-brown/70">
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

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.6rem] border border-white/60 bg-white shadow-warm-lg lg:aspect-[6/5]">
              <motion.div
                style={{ y: shouldReduceMotion ? 0 : imageY }}
                className="absolute -inset-y-[12%] inset-x-0"
              >
                <Image
                  src="/assets/stitch/hero-food-plate.jpg"
                  alt="Sajian dari MAU'S Kitchen"
                  fill
                  loading="eager"
                  fetchPriority="high"
                  quality={75}
                  sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 64px), (max-width: 1263px) calc((100vw - 120px) / 2), 572px"
                  className="object-cover"
                />
              </motion.div>
              <motion.div
                style={{ opacity: shouldReduceMotion ? 1 : overlayOpacity }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-14 text-white md:px-5 md:pb-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-light">
                  Dibuat setelah kamu pesan
                </p>
                <p className="mt-1 text-sm font-semibold md:text-base">
                  Dari dapur rumahan, langsung untuk kamu.
                </p>
              </motion.div>
            </div>
            <a
              href="#menu-home"
              aria-label="Lanjut ke pilihan menu"
              className="btn-press absolute -bottom-5 right-5 flex size-12 items-center justify-center rounded-full border-4 border-cream-soft bg-gold text-brown-deep shadow-warm-lg"
            >
              <ArrowDown aria-hidden="true" className="size-5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
