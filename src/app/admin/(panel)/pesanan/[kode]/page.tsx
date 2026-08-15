import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, MessageCircle, User } from "lucide-react";

import { OrderDetailActions } from "@/components/admin/OrderDetailActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CopyButton } from "@/components/common/CopyButton";
import { getAdminOrder, getProofSignedUrl } from "@/lib/admin/orders";
import { formatRupiah } from "@/lib/format";
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

  return (
    <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/pesanan"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Kembali ke Daftar Pesanan
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-mono text-2xl font-bold text-brown-deep">
            {order.code}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-brown/70">
          {formatJakartaDateTime(order.createdAt)} WIB
        </p>

        <section className="mt-5 rounded-2xl border border-gold/20 bg-cream-soft p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            <User aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Data Pemesan
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
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
                <dt className="flex items-center gap-1.5 text-brown/80">
                  <MapPin
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    strokeWidth={1.75}
                  />
                  Alamat
                </dt>
                <dd className="max-w-xs text-right font-semibold leading-6 text-brown-deep">
                  {order.customer.address}
                  {order.customer.addressNote ? (
                    <span className="block text-xs font-normal text-brown/70">
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
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white transition-colors hover:bg-success/90 sm:w-auto sm:px-5"
          >
            <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Chat Pelanggan
          </a>
        </section>

        <section className="mt-4 rounded-2xl border border-gold/20 bg-cream-soft p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            Rincian Item
          </h2>
          <ul className="mt-3 divide-y divide-gold/15">
            {order.items.map((item) => (
              <li key={item.lineId} className="py-2.5 text-sm">
                <p className="font-semibold text-brown-deep">
                  {item.name}
                  {item.variantName ? ` (${item.variantName})` : ""}
                </p>
                <p className="text-xs leading-5 text-brown/70">
                  {item.quantity} × {formatRupiah(item.unitPrice)}
                  {item.addOns.length > 0
                    ? ` · + ${item.addOns.map((a) => a.name).join(", ")}`
                    : ""}
                </p>
                {item.note ? (
                  <p className="text-xs italic leading-5 text-brown/60">
                    Catatan: {item.note}
                  </p>
                ) : null}
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
        </section>

        <section className="mt-4 rounded-2xl border border-gold/20 bg-cream-soft p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            Pembayaran
          </h2>
          <p className="mt-3 text-sm text-brown-deep">
            Metode: <strong>{paymentMethodLabels[order.paymentMethod]}</strong>
          </p>
          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15 sm:w-auto sm:px-5"
            >
              <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Lihat Bukti Transfer
            </a>
          ) : (
            <p className="mt-2 text-xs leading-5 text-brown/60">
              Belum ada bukti bayar yang diunggah pelanggan.
            </p>
          )}
        </section>

        {order.customer.note ? (
          <section className="mt-4 rounded-2xl border border-gold/20 bg-cream-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
              Catatan Pelanggan
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-brown-deep">
              {order.customer.note}
            </p>
          </section>
        ) : null}

        <OrderDetailActions
          code={order.code}
          status={order.status}
          deliveryFee={order.deliveryFee}
          adminNote={order.adminNote ?? ""}
        />
      </div>
    </main>
  );
}
