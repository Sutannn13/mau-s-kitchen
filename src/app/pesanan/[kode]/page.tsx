import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, ReceiptText } from "lucide-react";

import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { formatRupiah } from "@/lib/format";
import { getOrderByCode } from "@/lib/order-store";
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  paymentMethodLabels,
} from "@/lib/whatsapp";
import type { OrderStatus } from "@/types/order";

interface PesananPageProps {
  params: Promise<{ kode: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pesanan",
  robots: { index: false, follow: false },
};

const statusLabels: Record<OrderStatus, string> = {
  BARU: "Baru",
  DIKONFIRMASI: "Dikonfirmasi",
  DIPROSES: "Diproses",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  BATAL: "Batal",
};

function formatJakartaDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function PesananPage({ params }: PesananPageProps) {
  const { kode } = await params;
  const order = await getOrderByCode(kode);
  if (!order) {
    notFound();
  }

  const resendUrl = buildWhatsAppUrl(buildOrderMessage(order));
  const askStatusMessage = `Halo MAU'S Kitchen 👋 Saya mau tanya status pesanan saya dengan kode *${order.code}*.`;
  const askStatusUrl = buildWhatsAppUrl(askStatusMessage);

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Kembali ke Beranda
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
            Pesanan{" "}
            <span className="font-mono tracking-wide">{order.code}</span>
          </h1>
          <span className="rounded-full bg-gold/15 px-4 py-1.5 text-sm font-bold text-brown-deep">
            {statusLabels[order.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-brown/70">
          Dibuat {formatJakartaDateTime(order.createdAt)} WIB
        </p>

        <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            Status Pesanan
          </h2>
          <div className="mt-5">
            <OrderStatusTimeline status={order.status} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            <ReceiptText aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Rincian Pesanan
          </h2>
          <ul className="mt-4 divide-y divide-gold/15">
            {order.items.map((item) => (
              <li key={item.lineId} className="flex justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block font-semibold text-brown-deep">
                    {item.name}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </span>
                  <span className="block text-xs leading-5 text-brown/60">
                    {item.quantity} × {formatRupiah(item.unitPrice)}
                    {item.addOns.length > 0
                      ? ` · + ${item.addOns.map((addOn) => addOn.name).join(", ")}`
                      : ""}
                  </span>
                  {item.note ? (
                    <span className="block text-xs italic leading-5 text-brown/60">
                      Catatan: {item.note}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-gold/20 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brown/80">Subtotal</dt>
              <dd className="font-semibold tabular-nums text-brown-deep">
                {formatRupiah(order.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brown/80">Ongkir</dt>
              <dd className="font-semibold text-brown/70">
                {order.deliveryFee === null
                  ? "dikonfirmasi admin"
                  : formatRupiah(order.deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gold/20 pt-2">
              <dt className="font-bold text-brown-deep">TOTAL</dt>
              <dd className="text-lg font-bold tabular-nums text-brown-deep">
                {formatRupiah(order.total)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-brown/60">
            Metode pembayaran: {paymentMethodLabels[order.paymentMethod]}.
          </p>
        </section>

        <div className="mt-6 space-y-2">
          {order.paymentMethod !== "tunai" && order.status === "BARU" ? (
            <Link
              href={`/pembayaran/${order.code}`}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
            >
              Lihat Instruksi Pembayaran
            </Link>
          ) : null}
          <a
            href={askStatusUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white transition-colors hover:bg-success/90"
          >
            <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Tanya Status Pesanan
          </a>
          <a
            href={resendUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
          >
            Kirim Ulang Pesanan ke WhatsApp
          </a>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-brown/60">
          Simpan kode pesanan ini — admin akan menghubungi kamu lewat WhatsApp.
        </p>
      </div>
    </main>
  );
}
