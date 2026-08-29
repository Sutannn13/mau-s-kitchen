"use client";

import { Ban, Check, Save, Truck, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  calculateDeliveryMargin,
  deliveryProviderLabels,
  isDeliveryPlanReady,
} from "@/lib/order-delivery";
import { formatRupiah } from "@/lib/format";
import { canTransition, statusLabels } from "@/lib/order-status";
import { canEditDeliveryFee } from "@/lib/order-pricing";
import type {
  DeliveryProvider,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@/types/order";

interface OrderDetailActionsProps {
  code: string;
  status: OrderStatus;
  orderType: OrderType;
  deliveryFee: number | null;
  deliveryProvider: DeliveryProvider | null;
  courierCost: number | null;
  paymentMethod: PaymentMethod;
  paymentLocked: boolean;
  adminNote: string;
}

const statusActions: Array<{ target: OrderStatus; label: string }> = [
  { target: "DIKONFIRMASI", label: "Konfirmasi" },
  { target: "DIPROSES", label: "Proses" },
  { target: "DIKIRIM", label: "Kirim" },
  { target: "SELESAI", label: "Selesai" },
];

const deliveryProviders = Object.keys(
  deliveryProviderLabels,
) as DeliveryProvider[];

export function OrderDetailActions({
  code,
  status,
  orderType,
  deliveryFee,
  deliveryProvider,
  courierCost,
  paymentMethod,
  paymentLocked,
  adminNote,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [feeValue, setFeeValue] = useState(
    deliveryFee === null ? "" : String(deliveryFee),
  );
  const [providerValue, setProviderValue] = useState<DeliveryProvider | "">(
    deliveryProvider ?? "",
  );
  const [courierCostValue, setCourierCostValue] = useState(
    courierCost === null ? "" : String(courierCost),
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

  async function handleSaveDeliveryPlan(): Promise<void> {
    const trimmedFee = feeValue.trim();
    if (!/^\d+$/.test(trimmedFee)) {
      setError("Ongkir pelanggan wajib diisi dengan angka 0 atau lebih.");
      return;
    }
    if (!providerValue) {
      setError("Pilih siapa yang mengantar pesanan.");
      return;
    }
    const trimmedCost =
      providerValue === "internal" ? "0" : courierCostValue.trim();
    if (!/^\d+$/.test(trimmedCost)) {
      setError("Biaya kurir aktual wajib diisi dengan angka 0 atau lebih.");
      return;
    }
    if (paymentMethod === "tunai" && providerValue !== "internal") {
      setError(
        "Pesanan Tunai/COD hanya boleh diantar langsung oleh MAU'S Kitchen.",
      );
      return;
    }

    const actualCourierCost = Number.parseInt(trimmedCost, 10);
    if (
      await patch({
        deliveryFee: Number.parseInt(trimmedFee, 10),
        deliveryProvider: providerValue,
        courierCost: actualCourierCost,
      })
    ) {
      setCourierCostValue(String(actualCourierCost));
      setNotice("Pengantar, ongkir pelanggan, dan biaya kurir tersimpan.");
    }
  }

  async function handleSaveNote(): Promise<void> {
    if (await patch({ adminNote: noteValue.trim() })) {
      setNotice("Catatan admin tersimpan.");
    }
  }

  const isFinal = status === "SELESAI" || status === "BATAL";
  const deliveryPlanPending = !isDeliveryPlanReady({
    orderType,
    deliveryFee,
    deliveryProvider,
    courierCost,
  });
  const deliveryPlanEditable = canEditDeliveryFee({
    orderType,
    status,
    paymentClaimedAt: paymentLocked ? "locked" : null,
  });
  const parsedFee = /^\d+$/.test(feeValue)
    ? Number.parseInt(feeValue, 10)
    : null;
  const effectiveCostValue =
    providerValue === "internal" ? "0" : courierCostValue;
  const parsedCourierCost = /^\d+$/.test(effectiveCostValue)
    ? Number.parseInt(effectiveCostValue, 10)
    : null;
  const deliveryMargin = calculateDeliveryMargin(parsedFee, parsedCourierCost);

  return (
    <section className="mt-3.5 sm:mt-6 space-y-4 sm:space-y-6 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3.5 sm:p-5">
      <div>
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
          Aksi Status
        </h2>
        <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {statusActions.map((action) => (
            <button
              key={action.target}
              type="button"
              disabled={
                isBusy ||
                !canTransition(status, action.target) ||
                (action.target === "DIKONFIRMASI" && deliveryPlanPending)
              }
              onClick={() => void handleStatus(action.target)}
              className="flex min-h-9 sm:min-h-11 items-center gap-1.5 rounded-full bg-gold px-3 sm:px-4 text-xs sm:text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              {action.target === "DIKONFIRMASI" ? (
                <Check aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
              ) : action.target === "DIPROSES" ? (
                <UtensilsCrossed aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
              ) : (
                <Truck aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
              )}
              {action.label}
            </button>
          ))}

          {canTransition(status, "BATAL") ? (
            confirmCancel ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleStatus("BATAL")}
                  className="flex min-h-9 sm:min-h-11 items-center gap-1.5 rounded-full bg-chili px-3 sm:px-4 text-xs sm:text-sm font-bold text-white disabled:opacity-60"
                >
                  <Ban aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
                  Ya, Batalkan
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="flex min-h-9 sm:min-h-11 items-center rounded-full border border-gold/40 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-brown"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setConfirmCancel(true)}
                className="flex min-h-9 sm:min-h-11 items-center gap-1.5 rounded-full border border-chili/50 px-3 sm:px-4 text-xs sm:text-sm font-bold text-chili disabled:opacity-60"
              >
                <Ban aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
                Batalkan
              </button>
            )
          ) : null}
        </div>
        {isFinal ? (
          <p className="mt-2 text-[11px] sm:text-xs text-brown/60">
            Pesanan sudah final ({statusLabels[status]}) — tidak ada aksi lanjutan.
          </p>
        ) : null}
        {deliveryPlanPending && status === "BARU" ? (
          <p className="mt-2 text-[11px] sm:text-xs font-semibold leading-4 sm:leading-5 text-amber-700">
            Tetapkan pengantar dan biaya lengkap sebelum mengonfirmasi pesanan.
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
          Pengantaran dan Ongkir
        </h2>
        {orderType === "ambil" ? (
          <p className="mt-2.5 sm:mt-3 rounded-xl border border-gold/25 bg-cream px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-brown-deep">
            Ambil Sendiri — tidak memakai kurir dan ongkir tetap Rp0.
          </p>
        ) : (
          <>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown/65">
              Ongkir pelanggan masuk ke total pesanan. Biaya kurir adalah biaya
              aktual usaha; selisihnya menjadi margin atau subsidi ongkir.
            </p>
            {paymentMethod === "tunai" ? (
              <p className="mt-2.5 sm:mt-3 rounded-xl border border-amber-400/50 bg-amber-50 px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-semibold leading-4 sm:leading-5 text-amber-900">
                Tunai/COD hanya dapat memakai pengantaran langsung MAU&apos;S Kitchen.
                GoSend/GrabExpress biasa tidak ditugaskan menagih harga makanan.
              </p>
            ) : null}
            <div className="mt-2.5 sm:mt-3 grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              <label className="text-[11px] sm:text-xs font-semibold text-brown/75">
                Pengantar
                <select
                  value={providerValue}
                  disabled={!deliveryPlanEditable}
                  onChange={(event) => {
                    const provider = event.target.value as DeliveryProvider | "";
                    setProviderValue(provider);
                    if (provider === "internal") setCourierCostValue("0");
                  }}
                  className="mt-1 min-h-9 sm:min-h-11 w-full rounded-xl border border-gold/30 bg-cream px-2.5 sm:px-3 text-xs sm:text-sm text-brown-deep outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Pilih pengantar</option>
                  {deliveryProviders.map((provider) => (
                    <option
                      key={provider}
                      value={provider}
                      disabled={paymentMethod === "tunai" && provider !== "internal"}
                    >
                      {deliveryProviderLabels[provider]}
                    </option>
                  ))}
                </select>
              </label>

              <CurrencyInput
                id="delivery-fee"
                label="Ongkir ke pelanggan"
                value={feeValue}
                disabled={!deliveryPlanEditable}
                placeholder="Contoh: 10000"
                onChange={setFeeValue}
              />

              <CurrencyInput
                id="courier-cost"
                label="Biaya kurir aktual"
                value={providerValue === "internal" ? "0" : courierCostValue}
                disabled={!deliveryPlanEditable || providerValue === "internal"}
                placeholder="Harga dari aplikasi kurir"
                onChange={setCourierCostValue}
              />

              {deliveryMargin !== null ? (
                <p className="self-end rounded-xl bg-gold/10 px-3 py-2 text-[11px] sm:text-xs text-brown-deep">
                  Selisih ongkir: <strong>{formatRupiah(deliveryMargin)}</strong>{" "}
                  ({deliveryMargin < 0 ? "subsidi usaha" : "margin pengantaran"})
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={isBusy || !deliveryPlanEditable}
              onClick={() => void handleSaveDeliveryPlan()}
              className="mt-2.5 sm:mt-3 flex min-h-9 sm:min-h-11 items-center gap-1.5 rounded-full bg-gold px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-brown-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
              Simpan Pengantaran
            </button>
            {!deliveryPlanEditable ? (
              <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown/60">
                Pengantar dan ongkir terkunci setelah pembayaran diklaim, bukti
                dikirim, atau pesanan dikonfirmasi.
              </p>
            ) : null}
          </>
        )}
      </div>

      <div>
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-brown/60">
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
          onChange={(event) => setNoteValue(event.target.value)}
          className="mt-2 sm:mt-3 w-full rounded-xl border border-gold/30 bg-cream p-2.5 sm:p-3 text-xs sm:text-sm leading-5 sm:leading-6 text-brown-deep outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          placeholder="Contoh: bukti transfer valid, pelanggan minta sambel dipisah."
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handleSaveNote()}
          className="mt-2 flex min-h-9 sm:min-h-11 items-center gap-1.5 rounded-full bg-gold px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-brown-deep disabled:opacity-60"
        >
          <Save aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2} />
          Simpan Catatan
        </button>
      </div>

      {notice ? (
        <p role="status" className="rounded-xl bg-emerald-100 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-chili/10 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-chili">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function CurrencyInput({
  id,
  label,
  value,
  disabled,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="text-[11px] sm:text-xs font-semibold text-brown/75">
      {label}
      <span className="mt-1 flex min-h-9 sm:min-h-11 items-center rounded-xl border border-gold/30 bg-cream px-2.5 sm:px-3">
        <span className="mr-1 text-xs sm:text-sm font-normal text-brown/70">Rp</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ""))}
          className="min-h-9 sm:min-h-11 min-w-0 flex-1 bg-transparent text-xs sm:text-sm tabular-nums text-brown-deep outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </span>
    </label>
  );
}
