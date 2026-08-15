import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";
import { ProofUploadForm } from "@/components/common/ProofUploadForm";
import { paymentConfig } from "@/config/payment";
import { formatRupiah } from "@/lib/format";
import { getOrderByCode } from "@/lib/order-store";
import { hasServiceRoleKey } from "@/lib/supabase/config";
import {
  buildOrderMessage,
  buildPaymentConfirmationMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

interface PembayaranPageProps {
  params: Promise<{ kode: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selesaikan Pembayaran",
  robots: { index: false, follow: false },
};

// QRIS statis adalah aset dari pemilik; jika berkas belum ada, tampilkan
// placeholder tanpa mengarang gambar (docs/12_PAYMENT_QRIS.md §12.2/§12.7).
function getExistingQrisImagePath(): string | null {
  const imagePath = paymentConfig.qris.imagePath;
  return existsSync(join(process.cwd(), "public", imagePath))
    ? imagePath
    : null;
}

export default async function PembayaranPage({
  params,
}: PembayaranPageProps) {
  const { kode } = await params;
  const order = await getOrderByCode(kode);
  if (!order) {
    notFound();
  }

  const confirmationUrl = buildWhatsAppUrl(
    buildPaymentConfirmationMessage(order),
  );
  const resendUrl = buildWhatsAppUrl(buildOrderMessage(order));
  const qrisImage = getExistingQrisImagePath();
  const isTransfer = order.paymentMethod === "transfer";
  // Unggah bukti hanya aktif saat Supabase Storage tersedia (T6.8).
  const canUploadProof = hasServiceRoleKey() && !order.paymentProofUrl;

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
            Ongkir akan dikonfirmasi admin; nominal di atas adalah subtotal
            pesananmu.
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
              <div className="mx-auto mt-4 w-full max-w-[280px]">
                <div className="overflow-hidden rounded-2xl border border-gold/30 bg-white p-4">
                  <Image
                    src={qrisImage}
                    alt="Kode QRIS statis MAU'S Kitchen"
                    width={280}
                    height={280}
                    className="h-auto w-full object-contain"
                  />
                </div>
                <p className="mt-3 text-center text-xs leading-5 text-brown/70">
                  {paymentConfig.qris.merchantName} —{" "}
                  {paymentConfig.qris.note}
                </p>
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

        <div className="mt-6 space-y-2">
          <a
            href={confirmationUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white shadow-warm transition-colors hover:bg-success/90"
          >
            <CheckCircle2 aria-hidden="true" className="size-4" strokeWidth={2} />
            Saya Sudah Bayar &amp; Kirim Bukti
          </a>
          {canUploadProof ? <ProofUploadForm code={order.code} /> : null}
          <a
            href={resendUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
          >
            <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Kirim Ulang Pesanan ke WhatsApp
          </a>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-brown/60">
          Pesanan diproses setelah pembayaran dikonfirmasi admin.
        </p>
      </div>
    </main>
  );
}
