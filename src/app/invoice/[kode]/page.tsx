import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ReceiptText } from "lucide-react";

import { PrintInvoiceButton } from "@/components/order/PrintInvoiceButton";
import { siteConfig } from "@/config/site";
import { formatRupiah } from "@/lib/format";
import { getInvoicePaymentNote, isInvoiceAvailable } from "@/lib/invoice";
import { buildPublicOrderUrl, isValidOrderAccessToken } from "@/lib/order-access";
import { getOrderByPublicAccess } from "@/lib/order-store";
import { statusLabels } from "@/lib/order-status";
import { isOrderTotalFinal } from "@/lib/order-pricing";
import { lineSubtotal } from "@/lib/pricing";
import { paymentMethodLabels } from "@/lib/whatsapp";

interface InvoicePageProps {
  params: Promise<{ kode: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice Pesanan",
  robots: { index: false, follow: false },
};

function formatJakartaDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function InvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
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

  const orderUrl = buildPublicOrderUrl("pesanan", order.code, token);
  const totalFinal = isOrderTotalFinal(
    order.customer.orderType,
    order.deliveryFee,
  );

  if (!isInvoiceAvailable(order.status) || !totalFinal) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-brown-deep">
        <section className="mx-auto max-w-lg rounded-3xl border border-gold/30 bg-cream-soft p-6 text-center shadow-warm">
          <ReceiptText
            aria-hidden="true"
            className="mx-auto size-10 text-gold"
            strokeWidth={1.75}
          />
          <h1 className="mt-4 font-serif text-2xl font-bold">
            Invoice belum tersedia
          </h1>
          <p className="mt-2 text-sm leading-6 text-brown/80">
            Invoice dibuat setelah pesanan dikonfirmasi admin dan totalnya sudah
            final. Pesanan batal tidak menerbitkan invoice.
          </p>
          <Link
            href={orderUrl}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brown-deep px-5 text-sm font-bold text-cream"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali ke Status Pesanan
          </Link>
        </section>
      </main>
    );
  }

  const paymentNote = getInvoicePaymentNote(
    order.paymentMethod,
    order.status,
  );
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-[#eee9e2] px-3 py-5 text-brown-deep sm:px-5 sm:py-8">
      <div className="invoice-no-print mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <Link
          href={orderUrl}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brown hover:text-brown-deep"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Status Pesanan
        </Link>
        <PrintInvoiceButton />
      </div>

      <article className="invoice-document mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#d8cec2] bg-white shadow-xl">
        <header className="border-b-4 border-double border-gold/50 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                {siteConfig.name}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-gold">
                {siteConfig.tagline}
              </p>
              <p className="mt-3 text-xs leading-5 text-brown/70">
                WhatsApp {siteConfig.whatsappDisplay}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brown/60">
                Invoice
              </p>
              <h1 className="mt-1 font-mono text-xl font-bold sm:text-2xl">
                {order.code}
              </h1>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                {statusLabels[order.status]}
              </p>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <section className="grid gap-5 border-b border-[#e8e1d9] pb-6 sm:grid-cols-2">
            <div>
              <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brown/55">
                Ditagihkan kepada
              </h2>
              <p className="mt-2 text-sm font-bold">{order.customer.name}</p>
              <p className="mt-1 text-xs leading-5 text-brown/75">
                {order.customer.orderType === "antar"
                  ? "Pesanan antar"
                  : "Ambil sendiri"}
              </p>
              {order.customer.address ? (
                <p className="mt-1 text-xs leading-5 text-brown/75">
                  {order.customer.address}
                  {order.customer.addressNote
                    ? ` - ${order.customer.addressNote}`
                    : ""}
                </p>
              ) : null}
            </div>
            <dl className="space-y-2 text-xs sm:text-right">
              <div>
                <dt className="text-brown/55">Tanggal pesanan</dt>
                <dd className="mt-0.5 font-semibold">
                  {formatJakartaDateTime(order.createdAt)} WIB
                </dd>
              </div>
              <div>
                <dt className="text-brown/55">Jumlah item</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {itemCount} item
                </dd>
              </div>
              <div>
                <dt className="text-brown/55">Metode pembayaran</dt>
                <dd className="mt-0.5 font-semibold">
                  {paymentMethodLabels[order.paymentMethod]}
                </dd>
              </div>
            </dl>
          </section>

          <section className="pt-6">
            <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brown/55">
              Rincian pesanan
            </h2>
            <ul className="mt-3 divide-y divide-[#ece6df] border-y border-[#e8e1d9]">
              {order.items.map((item) => {
                const addOnTotal = item.addOns.reduce(
                  (total, addOn) => total + addOn.price,
                  0,
                );
                const unitTotal = item.unitPrice + addOnTotal;

                return (
                  <li
                    key={item.lineId}
                    className="invoice-line grid grid-cols-[1fr_auto] gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-5">
                        {item.name}
                        {item.variantName ? ` (${item.variantName})` : ""}
                      </p>
                      {item.addOns.length > 0 ? (
                        <p className="mt-1 text-xs leading-5 text-brown/70">
                          Tambahan: {item.addOns.map((addOn) => addOn.name).join(", ")}
                        </p>
                      ) : null}
                      <p className="mt-1 font-mono text-xs text-brown/65 tabular-nums">
                        {item.quantity} x {formatRupiah(unitTotal)}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-xs italic leading-5 text-brown/65">
                          Catatan: {item.note}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-mono text-sm font-bold tabular-nums">
                      {formatRupiah(lineSubtotal(item))}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ml-auto mt-6 max-w-sm space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-brown/70">Subtotal</p>
              <p className="font-mono font-semibold tabular-nums">
                {formatRupiah(order.subtotal)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-brown/70">Ongkir</p>
              <p className="font-mono font-semibold tabular-nums">
                {formatRupiah(order.deliveryFee ?? 0)}
              </p>
            </div>
            <div className="flex items-end justify-between gap-4 border-t-2 border-brown-deep pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Total
              </p>
              <p className="font-serif text-2xl font-bold tabular-nums">
                {formatRupiah(order.total)}
              </p>
            </div>
          </section>

          <section className="mt-7 rounded-xl bg-cream px-4 py-3 text-xs leading-5">
            <p className="font-bold">Keterangan pembayaran</p>
            <p className="mt-1 text-brown/75">{paymentNote}</p>
          </section>

          {order.customer.note ? (
            <section className="mt-5 text-xs leading-5">
              <h2 className="font-bold">Catatan pelanggan</h2>
              <p className="mt-1 whitespace-pre-line text-brown/75">
                {order.customer.note}
              </p>
            </section>
          ) : null}

          <footer className="mt-8 border-t border-dashed border-[#d8cec2] pt-5 text-center text-[0.68rem] leading-5 text-brown/55">
            Invoice memakai kode pesanan sebagai nomor dokumen dan tersedia setelah
            pesanan dikonfirmasi admin. Terima kasih sudah memilih {siteConfig.name}.
          </footer>
        </div>
      </article>
    </main>
  );
}
