"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  className?: string;
}

// Tombol −/+ 44px agar lolos target sentuh. Lihat docs/08_UI_UX_SPEC.md §8.8.
// Angka bergeser 4px dari arah perubahan (+ masuk dari bawah, − dari atas,
// 120ms) — feedback arah yang membaca tanpa perlu diperhatikan. Feedback
// tekan tombol ditangani rule global <button> di globals.css.
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  className,
}: QuantityStepperProps) {
  // 1 = menambah (angka baru masuk dari bawah), -1 = mengurangi.
  const [direction, setDirection] = useState<1 | -1>(1);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex h-11 shrink-0 items-stretch rounded-full border border-gold/30 bg-cream shadow-sm select-none",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => {
          setDirection(-1);
          onChange(value - 1);
        }}
        disabled={value <= min}
        aria-label="Kurangi jumlah"
        className="flex w-11 items-center justify-center rounded-l-full text-brown-deep transition-colors hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus aria-hidden="true" className="size-4" strokeWidth={2.5} />
      </button>
      <output
        aria-live="polite"
        className="flex min-w-10 items-center justify-center overflow-hidden border-x border-gold/25 px-2 text-sm font-bold tabular-nums text-brown-deep"
      >
        <motion.span
          key={value}
          initial={{ y: 4 * direction, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="block"
        >
          {value}
        </motion.span>
      </output>
      <button
        type="button"
        onClick={() => {
          setDirection(1);
          onChange(value + 1);
        }}
        disabled={max !== undefined && value >= max}
        aria-label="Tambah jumlah"
        className="flex w-11 items-center justify-center rounded-r-full text-brown-deep transition-colors hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
