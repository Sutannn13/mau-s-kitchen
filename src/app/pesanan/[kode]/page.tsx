import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";
import { OrderLiveTracker } from "@/components/order/OrderLiveTracker";
import { OrderProgressRing } from "@/components/order/OrderProgressRing";
import {
  OrderReceiptDetails,
  type ReceiptLine,
} from "@/components/order/OrderReceiptDetails";
import { OrderStatusPill } from "@/components/order/OrderStatusPill";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { PaymentClaimBanner } from "@/components/order/PaymentClaimBanner";
import { buildPublicOrderUrl, isValidOrderAccessToken } from "@/lib/order-access";
import {
  deliveryProviderLabels,
  isDeliveryPlanReady,
} from "@/lib/order-delivery";
import { isInvoiceAvailable } from "@/lib/invoice";
import { isOrderTotalFinal } from "@/lib/order-pricing";
import { getOrderByPublicAccess } from "@/lib/order-store";
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  paymentMethodLabels,
} from "@/lib/whatsapp";
import type { OrderStatus } from "@/types/order";

interface PesananPageProps {
  params: Promise<{ kode: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pesanan",
  robots: { index: false, follow: false },
};

function formatJakartaDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

// Satu kalimat "apa yang terjadi berikutnya" per status — menurunkan
// kecemasan pelanggan yang menunggu tanpa akun/notifikasi push
// (docs/04_BUSINESS_FLOW.md §4.3).
const nextStepHints: Record<OrderStatus, string> = {
  BARU: "Admin akan mengonfirmasi pesanan & ongkir lewat WhatsApp.",
  DIKONFIRMASI: "Pesanan sudah dikonfirmasi. Dapur segera menyiapkan pesananmu.",
  DIPROSES: "Pesananmu sedang dimasak fresh. Mohon tunggu sebentar ya.",
  DIKIRIM: "Pesanan sedang di jalan. Siapkan pembayaran bila memilih tunai/COD.",
  SELESAI: "Pesanan selesai. Terima kasih sudah memesan di MAU'S Kitchen!",
  BATAL: "Pesanan ini dibatalkan. Hubungi admin bila butuh bantuan.",
};

export default async function PesananPage({ params, searchParams }: PesananPageProps) {
  const { kode } = await params;
  const tokenParam = (await searchParams).token;
  const token = typeof tokenParam === "string" ? tokenParam : "";
  if (!isValidOrderAccessToken(token)) {
    notFound();
  }
  const order = await getOrderByPublicAccess(kode, token);
  if (!order) {
    notFound();
  }

  const resendUrl = buildWhatsAppUrl(buildOrderMessage(order));
  const askStatusMessage = `Halo MAU'S Kitchen 👋 Saya mau tanya status pesanan saya dengan kode *${order.code}*.`;
  const askStatusUrl = buildWhatsAppUrl(askStatusMessage);
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const paymentClaimed = Boolean(order.paymentClaimedAt);
  const awaitingVerification = paymentClaimed && order.status === "BARU";
  const totalFinal = isOrderTotalFinal(
    order.customer.orderType,
    order.deliveryFee,
  );
  const deliveryPlanReady = isDeliveryPlanReady({
    orderType: order.customer.orderType,
    deliveryFee: order.deliveryFee,
    deliveryProvider: order.deliveryProvider,
    courierCost: order.courierCost,
  });
  // Setelah pelanggan klaim bayar, instruksi pembayaran bukan lagi aksi utama.
  const showPaymentCta =
    order.paymentMethod !== "tunai" &&
    order.status === "BARU" &&
    !paymentClaimed &&
    deliveryPlanReady;

  const receiptLines: ReceiptLine[] = order.items.map((item) => ({
    lineId: item.lineId,
    name: item.name,
    variantName: item.variantName,
    unitPrice: item.unitPrice,
    addOns: item.addOns,
    quantity: item.quantity,
    note: item.note,
  }));

  return (
    <main className="bg-cream-soft pb-16 pt-6 md:pt-10">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Kembali ke Beranda
          </Link>

          {/*
            Artefak "struk & tiket dapur" (redesign Batch 7): satu objek utuh,
            bukan tumpukan kartu melayang. Stub gelap solid (tanpa gradien/orb)
            → perforasi tiket → badan struk krem → tepi sobek. Identitas dari
            tipografi mono/serif + material kertas, animasi stagger halus
            via motion (lihat OrderReceiptDetails).
          */}
          <div className="motion-safe:animate-reveal motion-reduce:animate-none relative mt-3">
            {/* Stub tiket: satu-satunya permukaan gelap di rute pelanggan,
                warna solid ink-soft — kontras tinggi untuk kode pesanan. */}
            <section className="rounded-t-[1.75rem] bg-ink-soft px-5 pb-6 pt-6 shadow-warm-lg md:px-7 md:pt-7">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-gold-light/75">
                    MAU&apos;S Kitchen · Kode Pesanan
                  </p>
                  <h1 className="mt-2 font-mono text-[1.65rem] font-bold leading-none tracking-[0.05em] text-cream md:text-4xl">
                    {order.code}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {order.status !== "BATAL" ? (
                    <OrderProgressRing status={order.status} />
                  ) : null}
                  <OrderStatusPill status={order.status} />
                </div>
              </div>

              <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-cream/55">
                <span>Dibuat {formatJakartaDateTime(order.createdAt)} WIB</span>
                <span aria-hidden="true" className="text-cream/30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck aria-hidden="true" className="size-3.5" strokeWidth={2} />
                  Tanpa login · tautan privat
                </span>
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <CopyButton
                  value={order.code}
                  label="Salin kode"
                  className="border-cream/25 text-cream hover:bg-cream/10 [&>svg]:text-gold-light"
                />
              </div>
              <p className="mt-2 text-[0.7rem] leading-4 text-cream/45">
                Kode ini untuk ditunjukkan ke admin saat menanyakan pesanan lewat
                WhatsApp.
              </p>

              <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-gold/20 bg-cream/[0.05] px-4 py-3 text-xs leading-5 text-cream/85">
                <BellRing
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-gold-light"
                  strokeWidth={2}
                />
                {awaitingVerification
                  ? "Pembayaran kamu sedang diverifikasi admin. Status berubah setelah pembayaran dicek."
                  : order.status === "BARU" && !deliveryPlanReady
                    ? "Admin sedang mengecek ongkir dan pengantar. Jangan bayar sebelum total akhir muncul."
                    : nextStepHints[order.status]}
              </p>

              {/* Garis perforasi tiket — pas di dasar stub, disembelahkan
                  notch di tepi pada kartu struk di bawah. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-4 bottom-0 border-t-2 border-dashed border-cream/20 md:inset-x-6"
              />
            </section>

            {/* Badan struk: kertas krem menerus dari stub; notch "menggigit"
                kedua tepi di garis perforasi memakai warna latar halaman. */}
            <section className="relative border-x border-gold/20 bg-[color:var(--surface)] px-5 pb-7 pt-6 shadow-warm md:px-7">
              <span
                aria-hidden="true"
                className="absolute -left-2.5 -top-2.5 size-5 rounded-full bg-[color:var(--surface-page)]"
              />
              <span
                aria-hidden="true"
                className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-[color:var(--surface-page)]"
              />

              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brown/70">
                Status Pesanan
              </h2>
              <div className="mt-5">
                <OrderStatusTimeline status={order.status} />
              </div>

              <div
                aria-hidden="true"
                className="my-6 border-t-2 border-dashed border-gold/30"
              />

              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brown/70">
                  <ReceiptText aria-hidden="true" className="size-4" strokeWidth={2} />
                  Rincian Pesanan
                </h2>
                <span className="shrink-0 rounded-full bg-gold/15 px-3 py-1 font-mono text-xs font-bold text-brown-deep tabular-nums">
                  {itemCount} item
                </span>
              </div>

              <OrderReceiptDetails
                items={receiptLines}
                subtotal={order.subtotal}
                deliveryFee={order.deliveryFee}
                total={order.total}
                totalFinal={totalFinal}
                paymentLabel={paymentMethodLabels[order.paymentMethod]}
              />
              {order.customer.orderType === "antar" ? (
                <p className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-xs leading-5 text-brown-deep">
                  Pengantaran: {order.deliveryProvider
                    ? deliveryProviderLabels[order.deliveryProvider]
                    : "sedang ditentukan admin"}.
                </p>
              ) : null}
            </section>

            {/* Tepi sobek struk (lihat .receipt-tear di globals.css). */}
            <div
              aria-hidden="true"
              className="receipt-tear border-x border-gold/20"
            />
          </div>

          {awaitingVerification ? (
            <PaymentClaimBanner proofSubmitted={Boolean(order.paymentProofUrl)} />
          ) : null}

          <OrderLiveTracker
            code={order.code}
            token={token}
            initialStatus={order.status}
            initialDeliveryFee={order.deliveryFee}
            initialDeliveryProvider={order.deliveryProvider}
            initialTotal={order.total}
          />

          {/* CTA hierarchy: primer full-width gold, sekunder outline */}
          <div className="mt-5 space-y-2.5">
            {showPaymentCta ? (
              <Link
                href={buildPublicOrderUrl("pembayaran", order.code, token)}
                className="btn-press group flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-all hover:bg-gold-light hover:shadow-warm-lg"
              >
                Lihat Instruksi Pembayaran
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  strokeWidth={2.25}
                />
              </Link>
            ) : null}
            {order.status === "BARU" && !totalFinal ? (
              <p className="flex min-h-12 w-full items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-6 text-center text-sm font-bold text-amber-800">
                Menunggu admin menetapkan pengantar dan ongkir
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {isInvoiceAvailable(order.status) && totalFinal ? (
                <Link
                  href={buildPublicOrderUrl("invoice", order.code, token)}
                  className="btn-press flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold/50 bg-cream-soft px-6 text-sm font-bold text-brown-deep transition-colors hover:bg-gold/15"
                >
                  <ReceiptText aria-hidden="true" className="size-4" strokeWidth={2} />
                  Lihat Invoice
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              <a
                href={askStatusUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-press flex min-h-11 items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white shadow-warm transition-all hover:bg-success/90 hover:shadow-warm-lg"
              >
                <MessageCircle aria-hidden="true" className="size-4" strokeWidth={2} />
                Tanya Status Pesanan
              </a>
            </div>
            <a
              href={resendUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
            >
              Kirim Ulang Pesanan ke WhatsApp
            </a>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-brown/80">
            Simpan kode pesanan ini — admin akan menghubungi kamu lewat WhatsApp.
          </p>
        </div>
      </div>
    </main>
  );
}
