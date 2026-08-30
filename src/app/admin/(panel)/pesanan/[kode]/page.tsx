import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  MapPin,
  MessageCircle,
  ReceiptText,
  User,
} from "lucide-react";

import { OrderDetailActions } from "@/components/admin/OrderDetailActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CopyButton } from "@/components/common/CopyButton";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { getAdminOrder, getProofSignedUrl } from "@/lib/admin/orders";
import {
  calculateDeliveryMargin,
  deliveryProviderLabels,
} from "@/lib/order-delivery";
import { formatRupiah } from "@/lib/format";
import { isInvoiceAvailable } from "@/lib/invoice";
import { buildPublicOrderUrl } from "@/lib/order-access";
import { isOrderTotalFinal } from "@/lib/order-pricing";
import { buildCustomerChatUrl } from "@/lib/whatsapp";
import { paymentMethodLabels } from "@/lib/whatsapp";

interface DetailPesananProps {
  params: Promise<{ kode: string }>;
}

function formatJakartaDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminDetailPesananPage({
  params,
}: DetailPesananProps) {
  const { kode } = await params;
  const order = await getAdminOrder(kode);
  if (!order) {
    notFound();
  }

  const chatUrl = buildCustomerChatUrl(order);
  const proofUrl = order.paymentProofUrl
    ? await getProofSignedUrl(order.paymentProofUrl)
    : null;
  const deliveryMargin = calculateDeliveryMargin(
    order.deliveryFee,
    order.courierCost,
  );
  const invoiceAvailable =
    isInvoiceAvailable(order.status) &&
    isOrderTotalFinal(order.customer.orderType, order.deliveryFee);

  return (
    <main className="stagger-in mx-auto w-full max-w-content px-3.5 pt-4 sm:px-4 sm:pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/pesanan"
          className="inline-flex min-h-9 sm:min-h-11 items-center gap-1.5 text-xs sm:text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={1.75} />
          Kembali ke Daftar Pesanan
        </Link>

        <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <h1 className="font-mono text-lg sm:text-2xl font-bold text-brown-deep">
            {order.code}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-xs sm:text-sm text-brown/70">
          {formatJakartaDateTime(order.createdAt)} WIB
        </p>
        {invoiceAvailable ? (
          <Link
            href={buildPublicOrderUrl("invoice", order.code, order.publicToken)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-gold/40 bg-cream-soft px-3.5 text-xs font-bold text-brown-deep transition-colors hover:bg-gold/15 sm:min-h-11 sm:px-4 sm:text-sm"
          >
            <ReceiptText
              aria-hidden="true"
              className="size-3.5 sm:size-4"
              strokeWidth={1.75}
            />
            Buka Invoice
          </Link>
        ) : (
          <p className="mt-2 text-[11px] leading-4 text-brown/60 sm:text-xs sm:leading-5">
            Invoice tersedia setelah pesanan dikonfirmasi.
          </p>
        )}

        {/* Linimasa progres (A10) — komponen presentational yang sama dengan
            halaman /pesanan/[kode] pelanggan (status-only, tanpa logika). */}
        <section className="mt-3.5 sm:mt-5 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3.5 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
            Progres Pesanan
          </h2>
          <div className="mt-3.5 sm:mt-5">
            <OrderStatusTimeline status={order.status} showDescriptions={false} />
          </div>
        </section>

        <section className="mt-3.5 sm:mt-5 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3.5 sm:p-5">
          <h2 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
            <User aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={1.75} />
            Data Pemesan
          </h2>
          <dl className="mt-3 space-y-2 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-brown/80">Nama</dt>
              <dd className="font-semibold text-brown-deep">{order.customer.name}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-brown/80">WhatsApp</dt>
              <dd className="flex items-center gap-2">
                <span className="font-semibold tabular-nums text-brown-deep">
                  {order.customer.whatsapp}
                </span>
                <CopyButton
                  value={order.customer.whatsapp}
                  label="Salin nomor"
                />
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-brown/80">Tipe pesanan</dt>
              <dd className="font-semibold text-brown-deep">
                {order.customer.orderType === "antar" ? "Antar" : "Ambil Sendiri"}
              </dd>
            </div>
            {order.customer.address ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1 text-brown/80">
                  <MapPin
                    aria-hidden="true"
                    className="size-3.5 sm:size-4 shrink-0"
                    strokeWidth={1.75}
                  />
                  Alamat
                </dt>
                <dd className="max-w-xs text-right font-semibold leading-5 sm:leading-6 text-brown-deep">
                  {order.customer.address}
                  {order.customer.addressNote ? (
                    <span className="block text-[11px] sm:text-xs font-normal text-brown/70">
                      Patokan: {order.customer.addressNote}
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
          <a
            href={chatUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3.5 sm:mt-4 flex min-h-9 sm:min-h-11 w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-success px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-success/90 sm:w-auto"
          >
            <MessageCircle aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={1.75} />
            Chat Pelanggan
          </a>
        </section>

        <section className="mt-3.5 sm:mt-4 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3.5 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
            Rincian Item
          </h2>
          <ul className="mt-3 divide-y divide-gold/15">
            {order.items.map((item) => (
              <li key={item.lineId} className="py-2 text-xs sm:py-2.5 sm:text-sm">
                <p className="font-semibold text-brown-deep">
                  {item.name}
                  {item.variantName ? ` (${item.variantName})` : ""}
                </p>
                <p className="text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown/70">
                  {item.quantity} × {formatRupiah(item.unitPrice)}
                  {item.addOns.length > 0
                    ? ` · + ${item.addOns.map((a) => a.name).join(", ")}`
                    : ""}
                </p>
                {item.note ? (
                  <p className="text-[11px] sm:text-xs italic leading-4 sm:leading-5 text-brown/60">
                    Catatan: {item.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-gold/20 pt-3 text-xs sm:text-sm">
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
            {order.customer.orderType === "antar" ? (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-brown/80">Pengantar</dt>
                  <dd className="text-right font-semibold text-brown-deep">
                    {order.deliveryProvider
                      ? deliveryProviderLabels[order.deliveryProvider]
                      : "belum ditetapkan"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-brown/80">Biaya kurir aktual</dt>
                  <dd className="font-semibold tabular-nums text-brown-deep">
                    {order.courierCost === null
                      ? "belum ditetapkan"
                      : formatRupiah(order.courierCost)}
                  </dd>
                </div>
                {deliveryMargin !== null ? (
                  <div className="flex justify-between">
                    <dt className="text-brown/80">
                      {deliveryMargin < 0 ? "Subsidi ongkir" : "Margin ongkir"}
                    </dt>
                    <dd className="font-semibold tabular-nums text-brown-deep">
                      {formatRupiah(Math.abs(deliveryMargin))}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex justify-between border-t border-gold/20 pt-2">
              <dt className="font-bold text-brown-deep">TOTAL</dt>
              <dd className="text-base sm:text-lg font-bold tabular-nums text-brown-deep">
                {formatRupiah(order.total)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-3.5 sm:mt-4 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3.5 sm:p-5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
            Pembayaran
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-brown-deep">
            Metode: <strong>{paymentMethodLabels[order.paymentMethod]}</strong>
          </p>
          {/* Klaim pelanggan, bukan verifikasi — admin tetap wajib mengecek
              mutasi/bukti sebelum mengubah status (docs/04 §4.3). */}
          {order.paymentClaimedAt ? (
            <p className="mt-2.5 sm:mt-3 flex items-start gap-1.5 sm:gap-2 rounded-xl bg-success/10 px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown-deep">
              <BadgeCheck
                aria-hidden="true"
                className="mt-0.5 size-3.5 sm:size-4 shrink-0 text-success"
                strokeWidth={2.25}
              />
              <span>
                Pelanggan menandai sudah bayar pada{" "}
                <strong>{formatJakartaDateTime(order.paymentClaimedAt)} WIB</strong>.
                Cek mutasi/bukti sebelum mengubah status.
              </span>
            </p>
          ) : null}
          {order.paymentMethod === "tunai" && order.status === "BARU" ? (
            <div className="mt-2.5 sm:mt-3 rounded-xl border border-amber-400/50 bg-amber-50 p-3 sm:p-3.5 text-[11px] sm:text-xs text-amber-950 shadow-sm">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                ⚠️ Perhatian: Pesanan Tunai / COD (Bayar di Tempat)
              </p>
              <p className="mt-1 leading-4 sm:leading-5 text-amber-900/90">
                Pelanggan belum membayar di muka. Sebelum mengubah status menjadi <strong>Dikonfirmasi</strong> atau mulai memasak di dapur, pastikan untuk menekan tombol <strong>Chat Pelanggan</strong> di atas guna konfirmasi kesiapan pesanan via WhatsApp untuk mencegah pesanan fiktif / batal sepihak.
              </p>
            </div>
          ) : null}
          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-9 sm:min-h-11 w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-gold/40 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-brown transition-colors hover:bg-gold/15 sm:w-auto"
            >
              <ExternalLink aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={1.75} />
              Lihat Bukti Transfer
            </a>
          ) : order.paymentMethod !== "tunai" ? (
            <p className="mt-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown/60">
              Belum ada bukti bayar yang diunggah pelanggan.
            </p>
          ) : null}
        </section>

        {order.customer.note ? (
          <section className="mt-3.5 sm:mt-4 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3.5 sm:p-5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
              Catatan Pelanggan
            </h2>
            <p className="mt-2.5 sm:mt-3 whitespace-pre-line text-xs sm:text-sm leading-5 sm:leading-6 text-brown-deep">
              {order.customer.note}
            </p>
          </section>
        ) : null}

        <OrderDetailActions
          code={order.code}
          status={order.status}
          orderType={order.customer.orderType}
          deliveryFee={order.deliveryFee}
          deliveryProvider={order.deliveryProvider}
          courierCost={order.courierCost}
          paymentMethod={order.paymentMethod}
          paymentLocked={Boolean(order.paymentClaimedAt || order.paymentProofUrl)}
          paymentClaimed={Boolean(order.paymentClaimedAt)}
          paymentProofSubmitted={Boolean(order.paymentProofUrl)}
          total={order.total}
          adminNote={order.adminNote ?? ""}
        />
      </div>
    </main>
  );
}
