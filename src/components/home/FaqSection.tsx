import { EyebrowRule } from "@/components/common/EyebrowRule";
import { Reveal } from "@/components/common/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";

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

        <Accordion type="single" defaultValue="faq-0" collapsible className="space-y-2.5">
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
