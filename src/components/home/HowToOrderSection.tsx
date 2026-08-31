import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ClipboardPenLine, QrCode, ShoppingBag } from "lucide-react";

import { EyebrowRule } from "@/components/common/EyebrowRule";
import { Card } from "@/components/ui";

interface OrderStep {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const orderSteps: OrderStep[] = [
  {
    title: "Pilih Menu",
    description: "Telusuri Taichan, Minuman, atau ChocoBerry favoritmu.",
    Icon: CheckCircle2,
  },
  {
    title: "Masuk Keranjang",
    description: "Atur ukuran, topping, catatan, dan jumlah pesanan.",
    Icon: ShoppingBag,
  },
  {
    title: "Isi Data",
    description: "Lengkapi nama, WhatsApp, serta pilihan antar atau ambil.",
    Icon: ClipboardPenLine,
  },
  {
    title: "Bayar & Konfirmasi",
    description: "Buat pesanan, lalu ikuti instruksi pembayaran atau status pesanan.",
    Icon: QrCode,
  },
];

export function HowToOrderSection() {
  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-2 flex items-center justify-center gap-2.5">
            <EyebrowRule />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
              Mudah dan tanpa daftar akun
            </p>
            <EyebrowRule />
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold text-brown-deep md:text-4xl">
            Empat langkah sampai pesanan dikonfirmasi
          </h2>
        </div>

        <div className="relative mt-8 md:mt-10">
          {/* Garis penghubung horizontal di desktop */}
          <span className="absolute left-[12%] right-[12%] top-[22px] hidden h-px border-t border-dashed border-gold/40 lg:block" aria-hidden="true" />
          <ol className="grid grid-cols-2 gap-3 scroll-reveal-stagger lg:grid-cols-4">
          {orderSteps.map((step, index) => (
            <Card
              as="li"
              key={step.title}
              className="scroll-reveal relative min-w-0 overflow-hidden p-4 sm:p-5"
            >
              <span className="absolute inset-x-0 top-0 h-1 bg-gold" />
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-brown-deep text-cream shadow-warm">
                  <step.Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="font-serif text-3xl font-bold text-brown/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-brown-deep sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-brown/85 sm:text-sm sm:leading-6">
                {step.description}
              </p>
            </Card>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
