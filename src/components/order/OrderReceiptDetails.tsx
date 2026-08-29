"use client";

import { Wallet } from "lucide-react";
import { motion, type Variants } from "motion/react";

import { formatRupiah } from "@/lib/format";
import { lineSubtotal, type PriceLine } from "@/lib/pricing";

// Baris rincian pesanan versi "struk": muncul bertahap (stagger) lewat
// motion agar halaman terasa hidup tanpa animasi dekoratif berlebihan.
// Hanya data serializable yang melewati batas RSC → client island.
// MotionConfig global (reducedMotion="user") meredam transform otomatis.
export interface ReceiptLine extends PriceLine {
  lineId: string;
  name: string;
  variantName: string | null;
  note?: string;
}

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
};

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

interface OrderReceiptDetailsProps {
  items: ReceiptLine[];
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  totalFinal: boolean;
  paymentLabel: string;
}

// Leader titik-titik ala struk fisik: label … nilai. Flex-basis berubah
// mengikuti lebar konten, bukan spasi tetap, supaya rapi di 360px.
function DottedRow({
  label,
  value,
  valueClassName = "font-semibold tabular-nums text-brown-deep",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <p className="shrink-0 text-brown/80">{label}</p>
      <span
        aria-hidden="true"
        className="-translate-y-1 flex-1 border-b-2 border-dotted border-brown/25"
      />
      <p className={`shrink-0 ${valueClassName}`}>{value}</p>
    </div>
  );
}

export function OrderReceiptDetails({
  items,
  subtotal,
  deliveryFee,
  total,
  totalFinal,
  paymentLabel,
}: OrderReceiptDetailsProps) {
  return (
    <motion.div variants={listVariants} initial="hidden" animate="show">
      <ul className="divide-y divide-gold/12">
        {items.map((item) => (
          <motion.li
            key={item.lineId}
            variants={lineVariants}
            className="flex gap-3 py-3.5"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 font-mono text-xs font-bold text-brown-deep"
            >
              {item.quantity}×
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-5 text-brown-deep">
                  <span className="sr-only">{item.quantity} × </span>
                  {item.name}
                  {item.variantName ? (
                    <span className="text-brown/80"> · {item.variantName}</span>
                  ) : null}
                </p>
                <p className="mt-0.5 font-mono text-xs leading-5 text-brown/80 tabular-nums">
                  {formatRupiah(item.unitPrice)} / porsi
                </p>
                {item.note ? (
                  <p className="mt-1.5 border-l-2 border-gold/35 pl-2.5 text-xs italic leading-5 text-brown/80">
                    {item.note}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 font-mono text-sm font-bold text-brown-deep tabular-nums">
                {formatRupiah(lineSubtotal(item))}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      <motion.div variants={lineVariants} className="mt-4 space-y-2.5">
        <DottedRow label="Subtotal" value={formatRupiah(subtotal)} />
        <DottedRow
          label="Ongkir"
          value={
            deliveryFee === null
              ? "dikonfirmasi admin"
              : formatRupiah(deliveryFee)
          }
          valueClassName={
            deliveryFee === null
              ? "text-right text-xs font-semibold leading-5 text-brown/80"
              : "font-semibold tabular-nums text-brown-deep"
          }
        />
      </motion.div>

      {/* Garis ganda + serif Playfair: cara struk klasik menandai angka
          akhir — hirarki dari tipografi, bukan panel gradien. */}
      <motion.div
        variants={lineVariants}
        className="mt-5 border-t-4 border-double border-gold/45 pt-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-brown/70">
            {totalFinal ? "Total Pembayaran" : "Subtotal Sementara"}
          </p>
          <p className="font-serif text-3xl font-bold leading-none text-brown-deep tabular-nums md:text-[2.1rem]">
            {formatRupiah(total)}
          </p>
        </div>
        {!totalFinal ? (
          <p className="mt-2 text-xs font-semibold leading-5 text-amber-700">
            Jangan bayar dulu. Total akhir menunggu ongkir dari admin.
          </p>
        ) : null}
        <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-brown/80">
          <Wallet aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2} />
          Metode pembayaran: {paymentLabel}
        </p>
      </motion.div>
    </motion.div>
  );
}
