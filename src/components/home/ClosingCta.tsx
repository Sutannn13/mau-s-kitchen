import { ArrowRight, MessageCircle } from "lucide-react";

import { MagneticButton } from "@/components/common/MagneticButton";
import { WhatsAppLink } from "@/components/common/WhatsAppLink";
import { MotionBorder } from "@/components/ui";

export function ClosingCta() {
  return (
    <section className="bg-rose/25 px-4 py-10 md:px-8 md:py-16">
      <MotionBorder className="mx-auto max-w-content">
        <div className="relative overflow-hidden px-5 py-10 text-center text-cream md:px-12 md:py-16">
          <span className="pointer-events-none absolute inset-3 rounded-[1.45rem] border border-gold/20" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-light">
              Dibuat setelah kamu pesan
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-2xl font-bold md:text-4xl">
              Lagi lapar? Atau lagi ingin yang manis?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-cream/75 md:text-base">
              Pilih menu sekarang, kami siapkan langsung dari dapur rumahan
              MAU&apos;S Kitchen.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <MagneticButton
                href="/menu"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep hover:bg-gold-light"
              >
                Pesan Sekarang
                <ArrowRight aria-hidden="true" className="size-4" />
              </MagneticButton>
              <WhatsAppLink
                message="Halo MAU'S Kitchen, aku mau pesan."
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cream/40 px-6 text-sm font-bold text-cream hover:bg-cream/10"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Tanya via WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </div>
      </MotionBorder>
    </section>
  );
}
