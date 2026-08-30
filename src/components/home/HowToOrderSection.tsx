import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ClipboardPenLine, QrCode, ShoppingBag } from "lucide-react";

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
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
              Mudah dan tanpa daftar akun
            </p>
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold text-brown-deep md:text-4xl">
            Empat langkah sampai pesanan dikonfirmasi
          </h2>
        </div>

        <div className="relative mt-8 md:mt-10">
          {/* Garis penghubung horizontal di desktop */}
          <span className="absolute left-[12%] right-[12%] top-[22px] hidden h-px border-t border-dashed border-gold/40 lg:block" aria-hidden="true" />
          <ol className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:px-0 lg:grid-cols-4">
          {orderSteps.map((step, index) => (
            <Card
              as="li"
              key={step.title}
              className="relative min-w-[78vw] shrink-0 snap-center overflow-hidden p-5 md:min-w-0 md:shrink"
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
                <span className="font-serif text-3xl font-bold text-gold/45">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-brown-deep">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-brown/70">
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
