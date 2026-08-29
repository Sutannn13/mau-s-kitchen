"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

import { cn } from "@/lib/utils";

import { chartPalette } from "./palette";

// Lingkaran persen dashboard: tingkat penyelesaian pesanan
// (pesanan SELESAI / total pesanan periode). Skala 0–100.

export function CompletionRadialChart({
  percent,
}: {
  percent: number;
}) {
  // Kokoh terhadap NaN/Infinity bila pembilang atau penyebut 0.
  const safe = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  const data = [{ name: "selesai", value: safe, fill: "url(#completion-grad)" }];

  return (
    <div className="relative mx-auto h-[180px] w-full max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={14}
        >
          <defs>
            <linearGradient id="completion-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E3C489" />
              <stop offset="100%" stopColor={chartPalette.gold} />
            </linearGradient>
          </defs>
          {/* Skala 0–100 agar nilai proporsional mengisi lingkaran. */}
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: chartPalette.brownDeep, fillOpacity: 0.08 }}
            dataKey="value"
            cornerRadius={20}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center",
        )}
      >
        <span className="font-serif text-3xl font-bold tabular-nums text-brown-deep">
          {Math.round(safe)}%
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brown/60">
          Selesai
        </span>
      </div>
    </div>
  );
}
