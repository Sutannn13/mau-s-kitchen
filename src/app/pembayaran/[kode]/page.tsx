import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, MessageCircle } from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";
import { PaymentProofActions } from "@/components/common/PaymentProofActions";
import { OrderLiveTracker } from "@/components/order/OrderLiveTracker";
import { paymentConfig, requiresPrepayment } from "@/config/payment";
import { formatRupiah } from "@/lib/format";
import {
  buildPublicOrderUrl,
  isValidOrderAccessToken,
} from "@/lib/order-access";
import { isDeliveryPlanReady } from "@/lib/order-delivery";
import { getOrderByPublicAccess } from "@/lib/order-store";
import { hasServiceRoleKey } from "@/lib/supabase/config";
import {
  buildOrderMessage,
  buildPaymentConfirmationMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

interface PembayaranPageProps {
  params: Promise<{ kode: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selesaikan Pembayaran",
  robots: { index: false, follow: false },
};

// QRIS statis adalah aset resmi dari pemilik (public/assets/payment/qris.jpeg,
// ter-commit di repo dan ikut ter-deploy sebagai aset statis). Pemeriksaan
// `existsSync(process.cwd()/public)` tidak bisa dipakai di runtime Cloudflare
// Workers karena `public/` tidak di-mount di worker — cukup andalkan flag
// `enabled` yang di-set saat aset tersedia (docs/12_PAYMENT_QRIS.md §12.2/§12.7).
function getExistingQrisImagePath(): string | null {
  return paymentConfig.qris.enabled ? paymentConfig.qris.imagePath : null;
}

export default async function PembayaranPage({
  params,
  searchParams,
}: PembayaranPageProps) {
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

  const trackingUrl = buildPublicOrderUrl("pesanan", order.code, token);
  const resendUrl = buildWhatsAppUrl(buildOrderMessage(order));

  // Bila status pesanan sudah bukan BARU (telah dikonfirmasi/diproses/dikirim/selesai oleh admin),
  // langsung alihkan pelanggan ke halaman status & rincian pesanan.
  if (order.status !== "BARU" || !requiresPrepayment(order.paymentMethod)) {
    redirect(trackingUrl);
  }

  const totalFinal = isDeliveryPlanReady({
    orderType: order.customer.orderType,
    deliveryFee: order.deliveryFee,
    deliveryProvider: order.deliveryProvider,
    courierCost: order.courierCost,
  });
  if (!totalFinal) {
    return (
      <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-3">
            <Clock3
              aria-hidden="true"
              className="size-8 shrink-0 text-gold-dark"
              strokeWidth={1.75}
            />
            <div>
              <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
                Menunggu Pengantaran Admin
              </h1>
              <p className="mt-1 text-sm leading-6 text-brown/70">
                Pesanan sudah tercatat. Jangan bayar sebelum total akhir tersedia.
              </p>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-gold/25 bg-cream-soft p-5 shadow-warm">
            <p className="text-sm text-brown/70">
              Kode Pesanan
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wide text-brown-deep">
              {order.code}
            </p>
            <div className="mt-5 border-t border-gold/20 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brown/60">
                Subtotal sementara
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-brown-deep">
                {formatRupiah(order.subtotal)}
              </p>
              <p className="mt-3 text-xs leading-5 text-amber-800">
                Admin akan mengecek jarak, memilih pengantar, dan menghubungi kamu
                lewat WhatsApp. Halaman ini otomatis diperbarui setelah biaya lengkap disimpan.
              </p>
            </div>
          </section>

          <div className="mt-6 space-y-2.5">
            <a
              href={resendUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white"
            >
              <MessageCircle aria-hidden="true" className="size-4" strokeWidth={2} />
              Kirim Pesanan ke WhatsApp
            </a>
            <Link
              href={trackingUrl}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown"
            >
              Lihat Rincian &amp; Status Pesanan
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <OrderLiveTracker
            code={order.code}
            token={token}
            initialStatus={order.status}
            initialDeliveryFee={order.deliveryFee}
            initialDeliveryProvider={order.deliveryProvider}
            initialTotal={order.total}
          />
        </div>
      </main>
    );
  }

  const confirmationUrl = buildWhatsAppUrl(
    buildPaymentConfirmationMessage(order),
  );
  const qrisImage = getExistingQrisImagePath();
  const isTransfer = order.paymentMethod === "transfer";
  // Unggah bukti hanya aktif saat Supabase Storage tersedia (T6.8).
  const canUploadProof =
    hasServiceRoleKey() && !order.paymentProofUrl && order.status === "BARU";
  // Klaim "sudah bayar" hanya untuk pembayaran di muka & status masih BARU.
  const canClaim = order.paymentMethod !== "tunai" && order.status === "BARU";

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="size-8 shrink-0 text-success"
            strokeWidth={1.75}
          />
          <div>
            <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
              Pesanan Diterima
            </h1>
            <p className="mt-1 text-sm text-brown/70">
              Pesanan kamu sudah kami catat. Tinggal bayar ya 🙌
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-2xl border border-gold/25 bg-cream-soft px-5 py-4 text-center text-sm text-brown/80">
          Kode Pesanan:{" "}
          <span className="font-mono text-base font-bold tracking-wide text-brown-deep">
            {order.code}
          </span>
        </p>

        <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            Total yang harus dibayar
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-3xl font-bold tabular-nums text-brown-deep">
              {formatRupiah(order.total)}
            </p>
            <CopyButton value={String(order.total)} label="Salin nominal" />
          </div>
          <p className="mt-3 text-xs leading-5 text-brown/60">
            Subtotal {formatRupiah(order.subtotal)} · Ongkir{" "}
            {formatRupiah(order.deliveryFee ?? 0)}. Nominal di atas sudah final.
          </p>
        </section>

        {isTransfer ? (
          <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
              Transfer Bank {paymentConfig.transfer.bankName}
            </h2>
            <p className="mt-3 text-sm leading-6 text-brown-deep">
              Nomor rekening:{" "}
              <span className="font-bold">
                {paymentConfig.transfer.accountNumber}
              </span>
              <br />
              a.n. {paymentConfig.transfer.accountName}
            </p>
            <p className="mt-3 rounded-xl bg-gold/10 px-4 py-3 text-xs leading-5 text-brown/80">
              Nomor rekening resmi akan dikonfirmasi admin lewat WhatsApp.
              Kirim pesan di bawah sebelum mentransfer ya.
            </p>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
              Scan QRIS di bawah ini
            </h2>
            {qrisImage !== null ? (
              <div className="mx-auto mt-4 w-full max-w-[360px]">
                <div className="overflow-hidden rounded-2xl border border-gold/30 bg-white p-4">
                  <Image
                    src={qrisImage}
                    alt={`Kode QRIS statis merchant ${paymentConfig.qris.merchantName}`}
                    width={908}
                    height={1280}
                    className="h-auto w-full object-contain"
                    priority
                  />
                </div>
                <p className="mt-3 text-center text-xs leading-5 text-brown/70">
                  Pastikan nama merchant yang tampil adalah{" "}
                  <strong>{paymentConfig.qris.merchantName}</strong>.{" "}
                  {paymentConfig.qris.note}
                </p>
                <a
                  href={qrisImage}
                  download
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 px-5 text-xs font-semibold text-brown transition-colors hover:bg-gold/15"
                >
                  Simpan Gambar QRIS
                </a>
              </div>
            ) : (
              <div className="mt-4 flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/40 bg-cream px-4 py-8 text-center">
                <p className="text-sm font-semibold text-brown-deep">
                  Gambar QRIS menyusul
                </p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-brown/70">
                  Sementara, konfirmasi pembayaran langsung ke admin lewat
                  tombol WhatsApp di bawah ini ya.
                </p>
              </div>
            )}
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-gold/20 bg-cream-soft p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            Langkah pembayaran
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-brown-deep">
            <li>Buka aplikasi e-wallet / m-banking kamu</li>
            <li>Pilih menu Scan QRIS atau Transfer</li>
            <li>Bayar sebesar {formatRupiah(order.total)}</li>
            <li>Selesaikan pembayaran & simpan bukti</li>
            <li>Tekan tombol konfirmasi di bawah</li>
          </ol>
        </section>

        <div className="mt-6">
          <PaymentProofActions
            code={order.code}
            token={token}
            confirmationUrl={confirmationUrl}
            resendUrl={resendUrl}
            trackingUrl={trackingUrl}
            canUploadProof={canUploadProof}
            proofRequired={order.paymentMethod === "qris"}
            proofSubmitted={Boolean(order.paymentProofUrl)}
            claimedAt={order.paymentClaimedAt ?? null}
            canClaim={canClaim}
          />
        </div>

        <div className="mt-4 text-center">
          <Link
            href={trackingUrl}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 text-xs font-semibold text-brown underline underline-offset-4 transition-colors hover:text-brown-deep"
          >
            Lihat Rincian &amp; Status Pesanan
            <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </Link>
        </div>

        <OrderLiveTracker
          code={order.code}
          token={token}
          initialStatus={order.status}
          initialDeliveryFee={order.deliveryFee}
          initialDeliveryProvider={order.deliveryProvider}
          initialTotal={order.total}
          redirectToOnStatusChange={trackingUrl}
        />

        <p className="mt-5 text-center text-xs leading-5 text-brown/60">
          Pesanan diproses setelah pembayaran dikonfirmasi admin.
        </p>
      </div>
    </main>
  );
}
