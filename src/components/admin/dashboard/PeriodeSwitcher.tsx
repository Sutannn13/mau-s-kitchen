"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type PeriodePreset = "hari-ini" | "7-hari" | "bulan-ini";

export const periodePresets: ReadonlyArray<{
  value: PeriodePreset;
  label: string;
}> = [
  { value: "hari-ini", label: "Hari Ini" },
  { value: "7-hari", label: "7 Hari" },
  { value: "bulan-ini", label: "Bulan Ini" },
];

// Toggle periode dashboard (docs/14 §14.0): navigasi tetap server-side
// (RSC + searchParams); pill emas meluncur antar tab via layout animation.
// Hanya elemen aktif yang merender motion.span — satu layoutId per halaman.
export function PeriodeSwitcher({ active }: { active: PeriodePreset }) {
  return (
    <nav
      aria-label="Pilih periode"
      className="inline-flex shrink-0 rounded-full border border-gold/25 bg-cream-soft p-1"
    >
      {periodePresets.map((preset) => {
        const isActive = preset.value === active;
        return (
          <Link
            key={preset.value}
            href={`/admin?periode=${preset.value}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex min-h-9 items-center rounded-full px-3.5 text-xs font-semibold transition-colors sm:text-sm",
              isActive ? "text-brown-deep" : "text-brown/70 hover:text-brown-deep",
            )}
          >
            {isActive ? (
              <motion.span
                aria-hidden="true"
                layoutId="periode-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gold shadow-warm"
              />
            ) : null}
            <span className="relative">{preset.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
