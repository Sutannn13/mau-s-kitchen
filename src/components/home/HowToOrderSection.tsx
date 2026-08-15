import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ClipboardPenLine, QrCode, ShoppingBag } from "lucide-react";

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
    description: "Pilih cara bayar lalu kirim rincian pesanan ke admin.",
    Icon: QrCode,
  },
];

export function HowToOrderSection() {
  return (
    <section className="bg-cream py-12 md:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Mudah dan tanpa daftar akun
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-brown-deep md:text-4xl">
            Empat langkah sampai pesanan dikonfirmasi
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {orderSteps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-full bg-brown-deep text-cream">
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
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
