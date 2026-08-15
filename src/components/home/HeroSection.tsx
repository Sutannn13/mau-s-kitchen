import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MessageCircle, Sparkles } from "lucide-react";

import { WhatsAppLink } from "@/components/common/WhatsAppLink";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-cream to-cream-soft">
      <div
        aria-hidden="true"
        className="absolute -left-20 top-12 size-64 rounded-full bg-rose/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 size-72 rounded-full bg-gold/20 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-content flex-col items-center px-4 py-14 text-center md:px-8 md:py-24">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full border border-gold/40"
          />
          <Image
            src="/assets/brand/logo-maus-kitchen.jpeg"
            alt="Logo MAU'S Kitchen dengan tagline Homemade with Love"
            width={160}
            height={160}
            quality={70}
            sizes="(max-width: 767px) 120px, 160px"
            className="relative size-[120px] rounded-full border-4 border-cream-soft object-cover shadow-warm md:size-40"
            priority
          />
        </div>

        <div className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/30 bg-white/60 px-4 text-xs font-semibold text-brown backdrop-blur sm:text-sm">
          <Clock3 aria-hidden="true" className="size-4 text-gold" strokeWidth={1.75} />
          Jam operasional: TBD
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brown sm:text-sm">
          <Sparkles aria-hidden="true" className="size-4 text-gold" />
          Homemade with Love
        </p>

        <h1 className="mt-4 max-w-4xl font-serif text-[2rem] font-bold leading-tight text-brown-deep sm:text-4xl md:text-5xl lg:text-[3.25rem]">
          Taichan Pedas, Minuman Segar, Dessert Coklat Premium
        </h1>

        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-brown/80 md:text-base">
          Dibuat segar setiap hari dari dapur rumahan kami. Pilih yang pedas,
          segar, atau manis sesuai suasana hati kamu.
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/menu"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-transform hover:-translate-y-0.5 hover:bg-gold-light"
          >
            Lihat Menu
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <WhatsAppLink
            message="Halo MAU'S Kitchen, aku mau lihat menu dan pesan."
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brown/40 bg-transparent px-6 text-sm font-bold text-brown-deep transition-colors hover:border-brown hover:bg-brown-deep hover:text-cream"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Pesan via WhatsApp
          </WhatsAppLink>
        </div>
      </div>
    </section>
  );
}
