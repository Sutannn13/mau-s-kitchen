"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}

// Tombol −/+ 44px agar lolos target sentuh. Lihat docs/08_UI_UX_SPEC.md §8.8.
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  label,
}: QuantityStepperProps) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center">
      <button
        type="button"
        onClick={() => {
          onChange(value - 1);
        }}
        disabled={value <= min}
        aria-label="Kurangi jumlah"
        className="flex size-11 items-center justify-center rounded-l-full border border-gold/30 bg-cream text-brown-deep transition-colors hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
      <output
        aria-live="polite"
        className="flex min-w-12 items-center justify-center border-y border-gold/30 bg-cream px-2 text-base font-bold tabular-nums text-brown-deep"
      >
        {value}
      </output>
      <button
        type="button"
        onClick={() => {
          onChange(value + 1);
        }}
        aria-label="Tambah jumlah"
        className="flex size-11 items-center justify-center rounded-r-full border border-gold/30 bg-cream text-brown-deep transition-colors hover:bg-gold/15"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
