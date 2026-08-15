import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, MessageCircle } from "lucide-react";

import { WhatsAppLink } from "@/components/common/WhatsAppLink";
import { siteConfig } from "@/config/site";

// Jam operasional & alamat masih TBD (docs/18_ROADMAP.md §18.4 no 1–2);
// tampilkan placeholder jujur, jangan menebak.
export const metadata: Metadata = {
  title: "Kontak & Jam Buka",
  description: `Hubungi ${siteConfig.name} lewat WhatsApp ${siteConfig.whatsappDisplay} untuk pesan atau tanya menu.`,
};

interface ContactRow {
  icon: typeof Clock;
  label: string;
  value: string;
}

export default function KontakPage() {
  const contactRows: ContactRow[] = [
    {
      icon: Clock,
      label: "Jam operasional",
      value: "TBD — akan diumumkan admin",
    },
    {
      icon: MapPin,
      label: "Alamat dapur",
      value: "TBD — akan diumumkan admin",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">
          Kontak
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-brown-deep md:text-4xl">
          Hubungi {siteConfig.name}
        </h1>
        <p className="mt-3 text-base leading-7 text-brown/75">
          Ada yang mau ditanya soal menu, harga, atau pengiriman? Paling cepat
          dijawab lewat WhatsApp ya.
        </p>

        <section className="mt-8 rounded-2xl border border-gold/20 bg-cream-soft p-6 shadow-warm md:p-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            WhatsApp Admin
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tabular-nums text-brown-deep">
                {siteConfig.whatsappDisplay}
              </p>
              <p className="mt-1 text-sm text-brown/70">
                Balasan tercepat di jam operasional.
              </p>
            </div>
            <WhatsAppLink
              message={`Halo ${siteConfig.name}, aku mau tanya tentang menu.`}
              className="flex min-h-12 items-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white transition-colors hover:bg-success/90"
            >
              <MessageCircle
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.75}
              />
              Chat WhatsApp
            </WhatsAppLink>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {contactRows.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl border border-gold/20 bg-cream-soft p-5"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-brown-deep">
                <row.icon
                  aria-hidden="true"
                  className="size-4 text-gold"
                  strokeWidth={1.75}
                />
                {row.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-brown/70">{row.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl bg-ink p-6 text-center md:p-8">
          <p className="font-serif text-xl font-bold text-cream md:text-2xl">
            Langsung mau pesan?
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-cream/75">
            Pilih menu dulu, isi data, lalu pesananmu otomatis diteruskan ke
            WhatsApp admin — tanpa perlu akun.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
          >
            Buka Menu
          </Link>
        </section>
      </div>
    </main>
  );
}
