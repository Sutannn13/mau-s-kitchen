import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CreditCard, Flame, Home, Leaf } from "lucide-react";

import { AmbientBackground } from "@/components/common/AmbientBackground";
import { EyebrowRule } from "@/components/common/EyebrowRule";
import { MagneticButton } from "@/components/common/MagneticButton";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui";
import { siteConfig } from "@/config/site";

// Copy dari docs/15_SEO_CONTENT.md §15.4 (Tentang Kami + Kenapa MAU'S Kitchen).
export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "Cerita di balik MAU'S Kitchen, dapur rumahan yang memasak dengan cinta.",
  alternates: { canonical: "/tentang" },
};

interface StoryStep {
  year: string;
  title: string;
  body: string;
}

// Timeline cerita — memetakan narasi yang sebelumnya tiga paragraf jadi
// langkah-langkah visual dengan marker tahun & garis penghubung. Copy tetap
// sama (AGENTS #2 — tidak mengarang sejarah), hanya dipisah per fase.
const storySteps: StoryStep[] = [
  {
    year: "Awal",
    title: "Dari dapur kecil di rumah",
    body: `${siteConfig.name} berawal dari dapur kecil di rumah dan satu keyakinan sederhana: makanan enak itu soal ketulusan, bukan ukuran dapurnya.`,
  },
  {
    year: "Lalu",
    title: "Sate taichan & sambal racikan",
    body: "Kami mulai dari sate taichan dengan sambal racikan sendiri — resep khas yang sampai sekarang jadi andalan pelanggan setia kami.",
  },
  {
    year: "Kini",
    title: "Minuman segar & ChocoBerry",
    body: "Pilihan kami meluas: minuman segar dan ChocoBerry — buah segar berbalut coklat premium. Setiap menu tetap disiapkan hari itu juga.",
  },
];

interface ValueItem {
  title: string;
  body: string;
  Icon: LucideIcon;
  accent: string;
}

// Nilai brand dirangkum dari tabel "Kenapa MAU'S Kitchen" docs/15_SEO_CONTENT.md §15.4.
const brandValues: ValueItem[] = [
  {
    title: "Dapur Rumahan",
    body: "Dimasak sendiri, bukan pabrikan. Rasa rumah yang konsisten.",
    Icon: Home,
    accent: "from-gold to-gold-light",
  },
  {
    title: "Bahan Segar",
    body: "Buah dan ayam dipilih setiap hari, bukan stok lama.",
    Icon: Leaf,
    accent: "from-pistachio to-success",
  },
  {
    title: "Sambal Racikan Sendiri",
    body: "Resep sambal taichan khas yang tidak ada di tempat lain.",
    Icon: Flame,
    accent: "from-chili to-rose",
  },
  {
    title: "Bayar Gampang",
    body: "Pilih metode pembayaran yang sedang tersedia saat checkout.",
    Icon: CreditCard,
    accent: "from-berry to-chili",
  },
];

export default function TentangPage() {
  return (
    <main className="relative">
      {/* HERO TENTANG — latar ambient + foto kitchen-story (asset sudah ada). */}
      <section className="relative overflow-hidden">
        <AmbientBackground
          imageSrc="/assets/stitch/kitchen-story-optimized.jpg"
          tone="warm"
          imageOpacity={50}
        />
        <div className="relative mx-auto w-full max-w-content px-4 pb-8 pt-10 md:px-8 md:pb-12 md:pt-16">
          <SectionHeading
            level="h1"
            eyebrow="Tentang Kami"
            title="Homemade with Love"
            subtitle={`Cerita di balik ${siteConfig.name}, dapur rumahan yang memasak dengan cinta sejak hari pertama.`}
          />
        </div>
      </section>

      {/* STORY TIMELINE — narasi sebagai langkah bernomor dengan marker. */}
      <section className="relative py-10 md:py-16">
        <div className="mx-auto w-full max-w-content px-4 md:px-8">
          <div className="mx-auto max-w-2xl">
            <SectionHeading
              align="center"
              eyebrow="Perjalanan kami"
              title="Dari dapur kecil, untuk kamu"
            />

            <ol className="relative mt-10 space-y-8 before:absolute before:left-[18px] before:top-2 before:h-[calc(100%-2rem)] before:w-px before:bg-gradient-to-b before:from-gold/60 before:via-gold/30 before:to-transparent md:before:left-1/2 md:before:-translate-x-1/2">
              {storySteps.map((step, i) => (
                <li key={step.title}>
                  <Reveal delay={i * 0.08}>
                    <div
                      className={`relative flex gap-4 md:gap-0 ${
                        i % 2 === 0 ? "md:flex-row-reverse" : ""
                      }`}
                    >
                      {/* Marker timeline */}
                      <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-cream-soft font-serif text-sm font-bold text-brown-deep shadow-warm md:absolute md:left-1/2 md:-translate-x-1/2">
                        {i + 1}
                      </span>
                      <div className="md:w-[calc(50%-3rem)] md:self-start">
                        <Card className="p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
                            {step.year}
                          </p>
                          <h3 className="mt-1.5 font-serif text-lg font-bold text-brown-deep">
                            {step.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-brown/75">
                            {step.body}
                          </p>
                        </Card>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal className="mt-10">
              <p className="rounded-2xl border border-gold/20 bg-cream-soft p-5 text-center text-base leading-7 text-brown-deep/90">
                Setiap pesanan disiapkan hari itu juga. Tidak ada stok
                semalam, tidak ada bahan asal-asalan. Itu janji kami sejak
                awal:{" "}
                <strong className="font-bold text-brown-deep">
                  Homemade with Love
                </strong>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* KENAPA — value cards editorial dengan ikon + accent bar. */}
      <section className="relative overflow-hidden py-10 text-cream md:py-16">
        <Image
          src="/assets/stitch/kitchen-story-optimized.jpg"
          alt=""
          fill
          unoptimized
          quality={60}
          sizes="100vw"
          className="object-cover blur-[2px] brightness-[0.42]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brown-deep/75 via-brown-deep/65 to-brown-deep/85" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-content px-4 md:px-8">
          <div className="mx-auto max-w-2xl">
            <SectionHeading
              align="center"
              eyebrowVariant="light"
              eyebrow="Kenapa MAU'S Kitchen"
              title="Sederhana, segar, dan dibuat sepenuh hati"
            />
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {brandValues.map((value) => (
              <li key={value.title}>
                <Reveal>
                  <Card
                    muted
                    className="relative h-full overflow-hidden border-cream/15 bg-white/[0.08] p-5 backdrop-blur-md transition-colors hover:bg-white/[0.12]"
                  >
                    <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${value.accent}`} aria-hidden="true" />
                    <span className="mt-1 flex size-11 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold-light">
                      <value.Icon
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={1.75}
                      />
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-cream">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-cream/65">
                      {value.body}
                    </p>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA PENUTUP — panel ink dengan MotionBorder-like accent ring. */}
      <section className="px-4 py-10 md:px-8 md:py-16">
        <div className="relative mx-auto max-w-content overflow-hidden rounded-[2rem] bg-ink px-5 py-10 text-center text-cream shadow-warm-lg md:px-12 md:py-16">
          <span className="pointer-events-none absolute inset-3 rounded-[1.45rem] border border-gold/20" />
          <div className="relative">
            <div className="mb-2 flex items-center justify-center gap-2.5">
              <EyebrowRule variant="light" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-light">
                Siap mencoba?
              </p>
              <EyebrowRule variant="light" />
            </div>
            <Heart
              aria-hidden="true"
              className="mx-auto size-8 text-flame"
              strokeWidth={1.75}
            />
            <h2 className="mt-3 font-serif text-2xl font-bold text-cream md:text-4xl">
              Penasaran rasanya?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-cream/75 md:text-base">
              Pesanan disiapkan segar di hari yang sama. Lihat menu dan pesan
              kapan saja tanpa perlu akun.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MagneticButton
                href="/menu"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep hover:bg-gold-light"
              >
                Lihat Menu Kami
                <ArrowRight aria-hidden="true" className="size-4" />
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
