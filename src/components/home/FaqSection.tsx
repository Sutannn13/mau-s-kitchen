import { EyebrowRule } from "@/components/common/EyebrowRule";
import { Reveal } from "@/components/common/Reveal";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Apakah harus bikin akun dulu?",
    answer:
      "Tidak. Langsung pilih menu, isi nama dan nomor WhatsApp, lalu checkout. Tidak perlu login atau daftar.",
  },
  {
    question: "Metode pembayaran apa saja yang tersedia?",
    answer:
      "Metode pembayaran yang sedang aktif ditampilkan saat checkout. Pilih salah satu metode yang tersedia untuk pesananmu.",
  },
  {
    question: "Apakah bisa diantar atau harus ambil sendiri?",
    answer:
      "Bisa keduanya. Pilih antar atau ambil sendiri saat checkout. Untuk pesanan antar, admin mengonfirmasi pengantar dan ongkir sebelum pembayaran.",
  },
  {
    question: "Berapa lama pesanan siap?",
    answer:
      "Waktu penyiapan bergantung pada menu dan antrean. Admin akan mengonfirmasi pesanan sebelum dapur mulai menyiapkannya.",
  },
  {
    question: "Bagaimana jika pesanan saya batal?",
    answer:
      "Hubungi admin via WhatsApp dengan kode pesanan. Pembatalan oleh pelanggan hanya dapat dilakukan sebelum pesanan berstatus Diproses.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-cream-soft py-10 md:py-16">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-8">
        <Reveal className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2.5">
            <EyebrowRule />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
              Sering ditanya
            </p>
            <EyebrowRule />
          </div>
          <h2 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
            Pertanyaan yang sering muncul
          </h2>
        </Reveal>

        <div className="space-y-2.5">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group overflow-hidden rounded-2xl border border-brown-deep/10 bg-cream shadow-warm open:border-gold/35"
            >
              <summary className="btn-press flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left text-sm font-bold text-brown-deep marker:content-none md:text-base">
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gold transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-4 text-sm leading-6 text-brown/85">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
