"use client";

import { Banknote, Building2, QrCode } from "lucide-react";

import { isPaymentMethodEnabled } from "@/config/payment";
import { cn } from "@/lib/utils";
import type { OrderType, PaymentMethod } from "@/types/order";

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  orderType: OrderType;
  onChange: (value: PaymentMethod) => void;
  error?: string;
}

const methods: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "qris",
    label: "QRIS",
    description: "DANA / GoPay / OVO / ShopeePay / m-banking",
    icon: <QrCode aria-hidden="true" className="size-6" strokeWidth={1.75} />,
  },
  {
    id: "transfer",
    label: "Transfer Bank",
    description: "BCA",
    icon: (
      <Building2 aria-hidden="true" className="size-6" strokeWidth={1.75} />
    ),
  },
  {
    id: "tunai",
    label: "Tunai / COD",
    description: "Bayar saat pesanan diterima",
    icon: (
      <Banknote aria-hidden="true" className="size-6" strokeWidth={1.75} />
    ),
  },
];

export function PaymentMethodPicker({
  value,
  orderType,
  onChange,
  error,
}: PaymentMethodPickerProps) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-brown-deep">
        Metode Pembayaran
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {methods.filter((method) => isPaymentMethodEnabled(method.id)).map((method) => {
          const isSelected = value === method.id;
          return (
            <label
              key={method.id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                isSelected
                  ? "border-gold bg-gold/15"
                  : "border-gold/25 bg-cream hover:border-gold/50",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={isSelected}
                onChange={() => {
                  onChange(method.id);
                }}
                className="sr-only"
              />
              <span className="text-gold">{method.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-brown-deep">
                  {method.label}
                </span>
                <span className="block text-xs leading-5 text-brown/70">
                  {method.id === "tunai"
                    ? orderType === "antar"
                      ? "Bayar saat diterima; khusus diantar langsung MAU'S Kitchen"
                      : "Bayar saat mengambil pesanan"
                    : method.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {orderType === "antar" ? (
        <p className="mt-3 rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-xs leading-5 text-brown/75">
          Antar tidak otomatis COD. Admin akan mengecek alamat, menetapkan ongkir,
          lalu memilih pengantaran langsung atau kurir online. Jika memilih Tunai/COD,
          pesanan hanya dapat diantar langsung oleh MAU&apos;S Kitchen.
        </p>
      ) : null}
      {methods.every((method) => !isPaymentMethodEnabled(method.id)) ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-chili">
          Metode pembayaran belum tersedia. Hubungi admin melalui WhatsApp.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-chili">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
