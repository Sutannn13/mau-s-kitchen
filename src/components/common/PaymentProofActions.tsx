"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { KitchenLoader } from "@/components/common/KitchenLoader";
import { Spinner } from "@/components/common/Spinner";
import {
  MAX_SOURCE_PROOF_SIZE_BYTES,
  preparePaymentProof,
  ProofImagePreparationError,
} from "@/lib/client-proof-image";

// Satu tombol utama di /pembayaran/[kode] (docs/11 §11.6, docs/08 §8.9),
// tiga fase beranimasi:
//   unggah    → "Unggah Bukti Bayar" (bila Storage aktif & belum ada bukti)
//   konfirmasi→ "Saya Sudah Bayar & Kirim Bukti" → POST /claim
//   menunggu  → loader dapur "Menunggu konfirmasi admin"
// Klaim tidak mengubah status pesanan; admin tetap yang memverifikasi
// (docs/04 §4.3). Fase awal diturunkan dari server agar tahan refresh.
type Phase = "upload" | "confirm" | "awaiting";

interface ClaimResponse {
  success: boolean;
  message?: string;
}

interface PaymentProofActionsProps {
  code: string;
  token: string;
  /** Pesan WhatsApp konfirmasi pembayaran — jalur cadangan, bukan utama. */
  confirmationUrl: string;
  resendUrl: string;
  trackingUrl: string;
  canUploadProof: boolean;
  proofSubmitted: boolean;
  /** ISO waktu klaim bila pelanggan sudah menekan tombol sebelumnya. */
  claimedAt: string | null;
  /** Klaim hanya berlaku untuk qris/transfer berstatus BARU. */
  canClaim: boolean;
}

export function PaymentProofActions({
  code,
  token,
  confirmationUrl,
  resendUrl,
  trackingUrl,
  canUploadProof,
  proofSubmitted,
  claimedAt,
  canClaim,
}: PaymentProofActionsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(() => {
    if (claimedAt !== null) {
      return "awaiting";
    }
    return canUploadProof ? "upload" : "confirm";
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [uploadedNow, setUploadedNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File): Promise<void> {
    setError(null);

    if (file.size > MAX_SOURCE_PROOF_SIZE_BYTES) {
      setError("Gambar asli maksimal 4MB.");
      return;
    }

    setIsUploading(true);
    try {
      const preparedFile = await preparePaymentProof(file);
      const formData = new FormData();
      formData.append("file", preparedFile);
      const response = await fetch(
        `/api/orders/${encodeURIComponent(code)}/proof?token=${encodeURIComponent(token)}`,
        { method: "POST", body: formData },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | ClaimResponse
          | null;
        setError(body?.message ?? "Gagal mengunggah. Coba lagi ya.");
        return;
      }
      setUploadedNow(true);
      setPhase("confirm");
    } catch (uploadError) {
      setError(
        uploadError instanceof ProofImagePreparationError
          ? uploadError.message
          : "Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleClaim(): Promise<void> {
    // Tanpa jalur klaim (mis. tunai), tombol tetap membuka WhatsApp.
    if (!canClaim) {
      window.open(confirmationUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setError(null);
    setIsClaiming(true);
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(code)}/claim?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as
        | ClaimResponse
        | null;

      if (!response.ok || body?.success !== true) {
        setError(
          body?.message ?? "Gagal menyimpan konfirmasi. Coba lagi sebentar ya.",
        );
        return;
      }
      setPhase("awaiting");
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setIsClaiming(false);
    }
  }

  const transition = { duration: 0.22, ease: "easeOut" } as const;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait" initial={false}>
        {phase === "awaiting" ? (
          <motion.div
            key="awaiting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
          >
            <div className="rounded-2xl border border-gold/25 bg-cream-soft p-5 shadow-warm">
              <KitchenLoader label="Menunggu konfirmasi admin" />
              <p
                aria-live="polite"
                className="mt-3 text-center text-sm font-semibold text-brown-deep"
              >
                Pembayaran ditandai sudah dibayar
              </p>
              <p className="mt-1 text-center text-xs leading-5 text-brown/80">
                Admin akan memeriksa pembayaranmu lalu mengubah status pesanan
                jadi Dikonfirmasi. Halaman status pesanan ikut diperbarui
                otomatis.
              </p>

              <Link
                href={trackingUrl}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
              >
                Lihat Status Pesanan
                <ArrowRight
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.25}
                />
              </Link>
              <a
                href={confirmationUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
              >
                <MessageCircle
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
                Kabari Admin lewat WhatsApp
              </a>
            </div>
          </motion.div>
        ) : phase === "confirm" ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
          >
            <motion.button
              type="button"
              disabled={isClaiming}
              onClick={() => {
                void handleClaim();
              }}
              whileTap={{ scale: 0.98 }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white shadow-warm transition-colors hover:bg-success/90 disabled:opacity-60"
            >
              {isClaiming ? (
                <>
                  <Spinner className="size-4" />
                  Menyimpan konfirmasi…
                </>
              ) : (
                <>
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={2}
                  />
                  Saya Sudah Bayar &amp; Kirim Bukti
                </>
              )}
            </motion.button>

            {uploadedNow || proofSubmitted ? (
              <p
                role="status"
                className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-emerald-700"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={2}
                />
                Bukti bayar tersimpan. Tekan tombol di atas untuk memberi tahu
                admin.
              </p>
            ) : null}
            {error !== null ? (
              <div className="mt-3 space-y-2 text-center">
                <p role="alert" className="text-xs font-semibold text-chili">
                  {error}
                </p>
                <Link
                  href={trackingUrl}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-gold px-5 text-xs font-bold text-brown-deep shadow-sm transition-colors hover:bg-gold-light"
                >
                  Lihat Status Pesanan
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
                // Reset agar memilih berkas sama setelah gagal tetap memicu change.
                event.target.value = "";
              }}
            />
            <motion.button
              type="button"
              disabled={isUploading}
              onClick={() => {
                inputRef.current?.click();
              }}
              whileTap={{ scale: 0.98 }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white shadow-warm transition-colors hover:bg-success/90 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Spinner className="size-4" />
                  Menyiapkan gambar…
                </>
              ) : (
                <>
                  <Upload
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.75}
                  />
                  Unggah Bukti Bayar
                </>
              )}
            </motion.button>

            <p className="mt-2 text-center text-xs leading-5 text-brown/70">
              JPG/PNG/WebP, pilih maksimal 4MB. Otomatis dikecilkan dan
              disimpan maksimal 1MB.
            </p>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setPhase("confirm");
              }}
              className="mt-2 min-h-11 w-full text-xs font-semibold text-brown/80 underline underline-offset-4 transition-colors hover:text-brown-deep"
            >
              Lewati unggah, saya kirim bukti lewat WhatsApp
            </button>
            {error !== null ? (
              <div className="mt-3 space-y-2 text-center">
                <p role="alert" className="text-xs font-semibold text-chili">
                  {error}
                </p>
                <Link
                  href={trackingUrl}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-gold px-5 text-xs font-bold text-brown-deep shadow-sm transition-colors hover:bg-gold-light"
                >
                  Lihat Status Pesanan
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "awaiting" ? null : (
        <a
          href={resendUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/40 px-6 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
        >
          <MessageCircle
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.75}
          />
          Kirim Ulang Pesanan ke WhatsApp
        </a>
      )}
    </div>
  );
}
