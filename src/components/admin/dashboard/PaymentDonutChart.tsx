"use client";

import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  type PieSectorShapeProps,
} from "recharts";

import { chartPalette } from "./palette";

// Donut metode pembayaran (docs/14 §14.5) — presentase & jumlah per metode.
// Upgrade premium 2026-08-23 ala Meta Ads: slice interaktif — slice yang
// di-hover membesar (outerRadius +6) dan teks tengah menampilkan metode
// tersebut (nama + jumlah + persen), kembali ke total saat tidak di-hover.
// Hover pada baris legenda memberi efek yang sama. Tooltip popup sengaja
// tidak dipakai: pada PieChart viewBox kecil tooltip recharts classik
// lolos keluar border panel; infonya sudah lengkap di chip + center.

export interface PaymentSlice {
  label: string;
  count: number;
  color: string;
}

export function PaymentDonutChart({ data }: { data: PaymentSlice[] }) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-2xl border border-dashed border-gold/25 bg-white/30 text-sm text-brown/55">
        Belum ada transaksi.
      </div>
    );
  }

  const active = data.find((slice) => slice.label === activeLabel);
  const activeShare =
    active !== undefined && total > 0
      ? Math.round((active.count / total) * 100)
      : 0;

  // Sector custom (recharts 3.x prop `shape`): slice yang di-hover dirender
  // dengan radius lebih besar + celah dalam tipis seirama aksen.
  function renderSector(props: PieSectorShapeProps): React.ReactNode {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;
    const isHovered = props.name === activeLabel;
    const grow = isHovered ? 6 : 0;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={(outerRadius ?? 0) + grow}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={4}
        />
        {isHovered ? (
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={(innerRadius ?? 0) - 3}
            outerRadius={(innerRadius ?? 0) - 1}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
          />
        ) : null}
      </g>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="relative h-[190px] w-[190px] shrink-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={62}
              outerRadius={82}
              paddingAngle={4}
              stroke={chartPalette.creamSoft}
              strokeWidth={3}
              shape={renderSector}
              onMouseEnter={(sector) => {
                setActiveLabel(String(sector.name ?? ""));
              }}
              onMouseLeave={() => {
                setActiveLabel(null);
              }}
            >
              {data.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {active !== undefined ? (
            <>
              <span
                className="max-w-[100px] truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: active.color }}
              >
                {active.label}
              </span>
              <span className="mt-0.5 font-serif text-[1.65rem] font-bold leading-none tabular-nums text-brown-deep">
                {active.count}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brown/55">
                {activeShare}% pesanan
              </span>
            </>
          ) : (
            <>
              <span className="font-serif text-[1.65rem] font-bold leading-none tabular-nums text-brown-deep">
                {total}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brown/55">
                Pesanan
              </span>
            </>
          )}
        </div>
      </div>
      {/* Legenda di bawah donut (stack) — panel metode pembayaran hanya
          ~304px di layout 3 kolom; donut+legenda berdampingan minta
          ~450px dan meluber keluar border kanan panel (terukur lewat
          getBoundingClientRect 2026-08-23). Stack vertikal muat di semua
          lebar; max-w-sm mencegah baris kelewat lebar di panel penuh. */}
      <ul className="flex w-full max-w-sm flex-col gap-2">
        {data.map((slice) => {
          const share = total > 0 ? Math.round((slice.count / total) * 100) : 0;
          const isActive = activeLabel === slice.label;
          return (
            <li
              key={slice.label}
              onMouseEnter={() => {
                setActiveLabel(slice.label);
              }}
              onMouseLeave={() => {
                setActiveLabel(null);
              }}
              className={
                "cursor-default rounded-xl border px-3 py-2.5 transition-colors " +
                (isActive
                  ? "border-gold/40 bg-gold/10"
                  : "border-gold/15 bg-white/40")
              }
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full ring-2 ring-white/60"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brown-deep">
                  {slice.label}
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-brown/70">
                  {slice.count}
                  <span className="mx-1 text-brown/30">·</span>
                  {share}%
                </span>
              </div>
              <div
                aria-hidden="true"
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-brown/8"
              >
                <div
                  className="bar-grow h-full rounded-full"
                  style={{
                    width: `${share}%`,
                    backgroundColor: slice.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
