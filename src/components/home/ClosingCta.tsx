import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { WhatsAppLink } from "@/components/common/WhatsAppLink";

export function ClosingCta() {
  return (
    <section className="bg-rose/30 px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-content overflow-hidden rounded-2xl bg-brown-deep px-5 py-10 text-center text-cream shadow-warm-lg md:px-12 md:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-light">
          Dibuat setelah kamu pesan
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl font-serif text-2xl font-bold md:text-4xl">
          Lagi lapar? Atau lagi ingin yang manis?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-cream/75 md:text-base">
          Pilih menu sekarang, kami siapkan langsung dari dapur rumahan MAU&apos;S
          Kitchen.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/menu"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep hover:bg-gold-light"
          >
            Pesan Sekarang
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <WhatsAppLink
            message="Halo MAU'S Kitchen, aku mau pesan."
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cream/40 px-6 text-sm font-bold text-cream hover:bg-cream/10"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Tanya via WhatsApp
          </WhatsAppLink>
        </div>
      </div>
    </section>
  );
}
