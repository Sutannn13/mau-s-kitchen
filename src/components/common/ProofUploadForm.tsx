"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";

// Unggah bukti pembayaran dari halaman /pembayaran/[kode] (docs/11 §11.6).
// Validasi tipe/ukuran dilakukan ulang di server.
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function ProofUploadForm({ code }: { code: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleFile(file: File): Promise<void> {
    setError(null);
    setIsBusy(true);

    try {
      if (file.size > MAX_SIZE_BYTES) {
        setError("Ukuran berkas maksimal 5MB.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/orders/${code}/proof`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(body?.message ?? "Gagal mengunggah. Coba lagi ya.");
        return;
      }
      setDone(true);
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }

  if (done) {
    return (
      <p
        role="status"
        className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-800"
      >
        <CheckCircle2 aria-hidden="true" className="size-4" strokeWidth={2} />
        Bukti bayar terkirim. Admin akan memverifikasi pesananmu.
      </p>
    );
  }

  return (
    <div className="mt-3">
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
        }}
      />
      <button
        type="button"
        disabled={isBusy}
        onClick={() => {
          inputRef.current?.click();
        }}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-cream px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15 disabled:opacity-60"
      >
        <Upload aria-hidden="true" className="size-4" strokeWidth={1.75} />
        {isBusy ? "Mengunggah…" : "Unggah Bukti Bayar (JPG/PNG/WebP, maks 5MB)"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-chili">
          {error}
        </p>
      ) : null}
    </div>
  );
}
