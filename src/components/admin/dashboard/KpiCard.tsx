"use client";

import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { CountUp, KpiRing, KpiSparkline } from "@/components/admin/dashboard/KpiVisuals";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

// Kartu KPI dashboard ala Meta Ads Manager / Shopify (docs/14 §14.0,
// upgrade premium 2026-08-23): angka count-up, aksen sparkline mini atau
// ring progress batal, badge trend pill. Kartu ini dirender di dalam
// wrapper yang dianimasi stagger-in — hover lift ada di kartu (child),
// bukan di elemen ber-animasi, supaya tidak ditimpa fill-mode both.
export interface KpiCardProps {
  label: string;
  value: number;
  format?: "rupiah" | "plain";
  hint?: string;
  icon: ReactNode;
  tone?: "default" | "muted";
  trend?: { delta: number | null } | null;
  sparkline?: readonly number[];
  sparklineColor?: string;
  ringPercent?: number;
}

export function KpiCard({
  label,
  value,
  format = "plain",
  hint,
  icon,
  tone = "default",
  trend = null,
  sparkline,
  sparklineColor,
  ringPercent,
}: KpiCardProps) {
  const hasTrend = trend !== null;
  const delta = trend?.delta ?? null;
  const TrendIcon =
    delta === null ? Minus : delta >= 0 ? TrendingUp : TrendingDown;
  const trendColor =
    delta === null
      ? "text-brown/55"
      : delta >= 0
        ? "text-pistachio"
        : "text-chili";

  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-gold/20 bg-cream-soft p-4 shadow-warm",
        "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg md:p-5",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
            tone === "muted"
              ? "bg-brown/8 text-brown/60 ring-brown/10"
              : "bg-gradient-to-br from-gold/30 to-gold/10 text-gold ring-gold/25",
          )}
        >
          {icon}
        </span>
        <p className="text-xs font-semibold text-brown/60">{label}</p>
      </div>
      <p className="mt-3 font-serif text-2xl font-bold tracking-tight tabular-nums text-brown-deep md:text-[1.75rem]">
        <CountUp
          value={value}
          format={(n) => (format === "rupiah" ? formatRupiah(n) : String(n))}
        />
      </p>
      {hasTrend ? (
        <p
          className={cn(
            "mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            delta === null
              ? "bg-brown/8"
              : delta >= 0
                ? "bg-pistachio/10"
                : "bg-chili/10",
            trendColor,
          )}
        >
          <TrendIcon className="size-3.5" strokeWidth={2} />
          {delta === null ? "baru" : `${delta >= 0 ? "+" : ""}${delta}%`}
          <span className="font-normal text-brown/40">vs lalu</span>
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-brown/55">{hint}</p>
      ) : null}
      {sparkline && sparkline.length > 1 ? (
        <div className="mt-auto pt-3">
          <KpiSparkline
            id={label.replace(/\s+/g, "-").toLowerCase()}
            values={sparkline}
            stroke={sparklineColor}
          />
        </div>
      ) : null}
      {ringPercent !== undefined ? (
        <div className="mt-auto flex items-end justify-end pt-3">
          <KpiRing percent={ringPercent} label={`Persen batal ${label}`} />
        </div>
      ) : null}
    </div>
  );
}
