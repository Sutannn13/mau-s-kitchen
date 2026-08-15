"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Check, Save, Truck, UtensilsCrossed } from "lucide-react";

import { canTransition, statusLabels } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";

interface OrderDetailActionsProps {
  code: string;
  status: OrderStatus;
  deliveryFee: number | null;
  adminNote: string;
}

// Deretan aksi status + ongkir + catatan admin (docs/14 §14.3).
// Tombol tidak sah dinonaktifkan (bukan disembunyikan); Batal dua langkah.
const statusActions: Array<{ target: OrderStatus; label: string }> = [
  { target: "DIKONFIRMASI", label: "Konfirmasi" },
  { target: "DIPROSES", label: "Proses" },
  { target: "DIKIRIM", label: "Kirim" },
  { target: "SELESAI", label: "Selesai" },
];

export function OrderDetailActions({
  code,
  status,
  deliveryFee,
  adminNote,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [feeValue, setFeeValue] = useState(
    deliveryFee === null ? "" : String(deliveryFee),
  );
  const [noteValue, setNoteValue] = useState(adminNote);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/orders/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? "Gagal menyimpan perubahan.");
        return false;
      }

      router.refresh();
      return true;
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStatus(target: OrderStatus): Promise<void> {
    if (await patch({ status: target })) {
      setNotice(`Status berubah menjadi ${statusLabels[target]}.`);
      setConfirmCancel(false);
    }
  }

  async function handleSaveFee(): Promise<void> {
    const trimmed = feeValue.trim();
    const fee =
      trimmed === ""
        ? null
        : Number.parseInt(trimmed.replace(/[^0-9]/g, ""), 10);

    if (trimmed !== "" && (fee === undefined || Number.isNaN(fee))) {
      setError("Ongkir harus berupa angka.");
      return;
    }

    if (await patch({ deliveryFee: fee })) {
      setNotice("Total diperbarui.");
    }
  }

  async function handleSaveNote(): Promise<void> {
    if (await patch({ adminNote: noteValue.trim() })) {
      setNotice("Catatan admin tersimpan.");
    }
  }

  const isFinal = status === "SELESAI" || status === "BATAL";

  return (
    <section className="mt-6 space-y-6 rounded-2xl border border-gold/20 bg-cream-soft p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
          Aksi Status
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {statusActions.map((action) => (
            <button
              key={action.target}
              type="button"
              disabled={isBusy || !canTransition(status, action.target)}
              onClick={() => {
                void handleStatus(action.target);
              }}
              className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              {action.target === "DIKONFIRMASI" ? (
                <Check aria-hidden="true" className="size-4" strokeWidth={2} />
              ) : action.target === "DIPROSES" ? (
                <UtensilsCrossed
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2}
                />
              ) : (
                <Truck aria-hidden="true" className="size-4" strokeWidth={2} />
              )}
              {action.label}
            </button>
          ))}

          {canTransition(status, "BATAL") ? (
            confirmCancel ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    void handleStatus("BATAL");
                  }}
                  className="flex min-h-11 items-center gap-1.5 rounded-full bg-chili px-4 text-sm font-bold text-white transition-colors hover:bg-chili/90 disabled:opacity-60"
                >
                  <Ban aria-hidden="true" className="size-4" strokeWidth={2} />
                  Ya, Batalkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCancel(false);
                  }}
                  className="flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  setConfirmCancel(true);
                }}
                className="flex min-h-11 items-center gap-1.5 rounded-full border border-chili/50 px-4 text-sm font-bold text-chili transition-colors hover:bg-chili/10 disabled:opacity-60"
              >
                <Ban aria-hidden="true" className="size-4" strokeWidth={2} />
                Batalkan
              </button>
            )
          ) : null}
        </div>
        {isFinal ? (
          <p className="mt-2 text-xs text-brown/60">
            Pesanan sudah final ({statusLabels[status]}) — tidak ada aksi lanjutan.
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
          Ongkir
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="ongkir-input" className="sr-only">
            Nilai ongkir dalam rupiah
          </label>
          <div className="flex min-h-11 items-center rounded-xl border border-gold/30 bg-cream px-3">
            <span className="mr-1 text-sm text-brown/70">Rp</span>
            <input
              id="ongkir-input"
              type="text"
              inputMode="numeric"
              value={feeValue}
              placeholder="kosong = dikonfirmasi admin"
              onChange={(event) => {
                setFeeValue(event.target.value);
              }}
              className="min-h-11 w-52 bg-transparent text-sm tabular-nums text-brown-deep outline-none"
            />
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              void handleSaveFee();
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:opacity-60"
          >
            <Save aria-hidden="true" className="size-4" strokeWidth={2} />
            Simpan Ongkir
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
          Catatan Admin
        </h2>
        <label htmlFor="admin-note" className="sr-only">
          Catatan admin untuk pesanan ini
        </label>
        <textarea
          id="admin-note"
          rows={3}
          maxLength={500}
          value={noteValue}
          onChange={(event) => {
            setNoteValue(event.target.value);
          }}
          className="mt-3 w-full rounded-xl border border-gold/30 bg-cream p-3 text-sm leading-6 text-brown-deep outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          placeholder="Contoh: bukti transfer valid, pelanggan minta sambel dipisah."
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            void handleSaveNote();
          }}
          className="mt-2 flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:opacity-60"
        >
          <Save aria-hidden="true" className="size-4" strokeWidth={2} />
          Simpan Catatan
        </button>
      </div>

      {notice ? (
        <p role="status" className="rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-chili/10 px-4 py-3 text-sm text-chili">
          {error}
        </p>
      ) : null}
    </section>
  );
}
