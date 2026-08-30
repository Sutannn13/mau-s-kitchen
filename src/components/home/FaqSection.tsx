"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

import { Reveal } from "@/components/common/Reveal";
import { cn } from "@/lib/utils";

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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-cream-soft py-10 md:py-16">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-8">
        <Reveal className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2.5">
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
              Sering ditanya
            </p>
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
            Pertanyaan yang sering muncul
          </h2>
        </Reveal>

        <div className="space-y-2.5">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-brown-deep/10 bg-cream shadow-warm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-brown-deep md:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 text-gold transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                    strokeWidth={2}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-label={item.question}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm leading-6 text-brown/75">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
