"use client";

import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { CountUp, KpiRing, KpiSparkline } from "@/components/admin/dashboard/KpiVisuals";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

// Kartu KPI dashboard ala Meta Ads Manager / Shopify (docs/14 §14.0,
// upgrade premium 2026-08-23; Warm Luxe 2026-09-04): angka count-up, aksen
// sparkline mini atau ring progress batal, badge trend pill, permukaan
// gradien + shadow luxe. Kartu ini dirender di dalam wrapper yang
// dianimasi stagger-in — hover lift ada di kartu (child), bukan di elemen
// ber-animasi, supaya tidak ditimpa fill-mode both.
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
        ? "text-success"
        : "text-chili";

  return (
    <div className="au-card au-card-hover group flex h-full flex-col rounded-2xl p-4 md:p-5">
      {/* Hairline emas di tepi atas — penanda premium halus. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        )}
      />
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
            tone === "muted"
              ? "bg-brown/8 text-brown/60 ring-brown/10"
              : "bg-gradient-to-br from-gold/35 to-gold/10 text-gold ring-gold/25",
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
            "mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
            delta === null
              ? "bg-brown/8 ring-brown/10"
              : delta >= 0
                ? "bg-pistachio/10 ring-pistachio/20"
                : "bg-chili/10 ring-chili/20",
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
