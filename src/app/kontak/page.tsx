import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MessageCircle, MapPin, MessageSquare } from "lucide-react";

import { AmbientBackground } from "@/components/common/AmbientBackground";
import { CopyButton } from "@/components/common/CopyButton";
import { EyebrowRule } from "@/components/common/EyebrowRule";
import { MagneticButton } from "@/components/common/MagneticButton";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { StoreStatusBadge } from "@/components/common/StoreStatusBadge";
import { WhatsAppLink } from "@/components/common/WhatsAppLink";
import { Card } from "@/components/ui";
import { siteConfig } from "@/config/site";

// Jika data operasional belum dikonfirmasi, arahkan pelanggan ke WhatsApp.
export const metadata: Metadata = {
  title: "Kontak & Jam Buka",
  description: `Hubungi ${siteConfig.name} lewat WhatsApp ${siteConfig.whatsappDisplay} untuk pesan atau tanya menu.`,
  alternates: { canonical: "/kontak" },
};

export default function KontakPage() {
  return (
    <main className="relative">
      {/* HERO — heading saja dengan ambient background. Ringkas, tidak
          menyertakan kartu agar padding section tidak menumpuk dengan
          blok konten di bawahnya (akar masalah "loncat" sebelumnya). */}
      <section className="relative overflow-hidden">
        <AmbientBackground tone="gold" imageOpacity={0} />
        <div className="relative mx-auto w-full max-w-2xl px-4 pt-10 md:px-8 md:pt-14">
          <SectionHeading
            level="h1"
            eyebrow="Kontak"
            title={`Hubungi ${siteConfig.name}`}
            subtitle="Ada yang mau ditanya soal menu, harga, atau pengiriman? Paling cepat dijawab lewat WhatsApp ya."
          />
        </div>
      </section>

      {/* KONTEN — semua kartu kontak dalam SATU container dengan space-y
          (bukan section terpisah dengan padding masing-masing). Ini
          menghilangkan double-padding yang menyebabkan jarak loncat. */}
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10">
        {/* WhatsApp card — kartu utama, full width. */}
        <Reveal>
          <Card className="relative overflow-hidden border-gold/25 bg-cream-soft p-6 shadow-warm md:p-8">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-success/15 text-success">
                <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
                WhatsApp Admin
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold tabular-nums text-brown-deep">
                  {siteConfig.whatsappDisplay}
                </p>
                <p className="mt-1 text-sm text-brown/70">
                  Balasan tercepat di jam operasional.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton value={siteConfig.whatsappDisplay} label="Salin nomor" />
                <WhatsAppLink
                  message={`Halo ${siteConfig.name}, aku mau tanya tentang menu.`}
                  className="btn-press flex min-h-12 items-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white transition-colors hover:bg-success/90"
                >
                  <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  Chat WhatsApp
                </WhatsAppLink>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* INFO GRID — 2 kartu di sm:grid-cols-2 = 1 baris rapi.
            Sebelumnya 3 kartu di grid 2-kolom menyebabkan 1 kartu
            menyendiri di baris kedua. Kini "Status buka" + "Jam
            operasional" digabung jadi satu kartu "Jam buka & status",
            dan "Alamat dapur" jadi kartu kedua — pas 2×1. */}
        <div>
          <Reveal>
            <div className="mb-4 flex items-center gap-2.5">
              <EyebrowRule />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
                Informasi dapur
              </p>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Kartu 1: Jam buka & status live (gabungan). */}
            <Reveal delay={0.08}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-gold/12 text-gold">
                    <Clock aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-sm font-bold text-brown-deep">
                    Jam buka & status
                  </h3>
                </div>
                <div className="mt-3">
                  <StoreStatusBadge />
                </div>
                <p className="mt-2 text-sm leading-6 text-brown/75">
                  {siteConfig.businessHours ?? "Konfirmasi via WhatsApp sebelum datang"}
                </p>
                <p className="mt-1 text-xs leading-5 text-brown/55">
                  Status dihitung live, diperbarui tiap menit.
                </p>
              </Card>
            </Reveal>

            {/* Kartu 2: Alamat dapur. */}
            <Reveal delay={0.14}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-gold/12 text-gold">
                    <MapPin aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-sm font-bold text-brown-deep">
                    Alamat dapur
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-brown/75">
                  {siteConfig.businessAddress ??
                    "Lokasi diberikan admin setelah pesanan dikonfirmasi"}
                </p>
              </Card>
            </Reveal>
          </div>
        </div>

        {/* CTA PENUTUP — dalam container yang sama, space-y menentukan
            jaraknya. Tidak ada padding section tambahan. */}
        <Reveal delay={0.08}>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-5 py-9 text-center text-cream shadow-warm-lg md:px-10 md:py-12">
            <span className="pointer-events-none absolute inset-3 rounded-[1.45rem] border border-gold/20" />
            <div className="relative">
              <div className="mb-2 flex items-center justify-center gap-2.5">
                <EyebrowRule variant="light" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-light">
                  Langsung pesan
                </p>
                <EyebrowRule variant="light" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-cream md:text-3xl">
                Langsung mau pesan?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-cream/75 md:text-base">
                Pilih menu dulu, isi data, lalu pesananmu langsung tercatat dan
                bisa dipantau tanpa perlu akun.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <MagneticButton
                  href="/menu"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep hover:bg-gold-light"
                >
                  Buka Menu
                  <ArrowRight aria-hidden="true" className="size-4" />
                </MagneticButton>
                <Link
                  href="/tentang"
                  className="btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cream/40 px-6 text-sm font-bold text-cream hover:bg-cream/10"
                >
                  <MessageSquare aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  Tentang Kami
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
