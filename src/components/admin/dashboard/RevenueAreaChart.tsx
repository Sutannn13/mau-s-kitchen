"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailySeriesPoint } from "@/lib/admin/orders";
import { formatRupiah } from "@/lib/format";

import { chartPalette } from "./palette";

// Kurva dashboard (docs/14 §14.0): omzet (SELESAI) sebagai area + jumlah
// pesanan sebagai garis pada sumbu kedu. Deret harian sudah jadi
// oleh getDailySeries, termasuk tanggal kosong bernilai 0.

function formatAxisDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${iso}T00:00:00+07:00`));
}

function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1) + "jt";
  }
  if (value >= 1_000) {
    return Math.round(value / 1_000) + "rb";
  }
  return String(value);
}

interface TooltipEntry {
  name: string;
  value: number;
  dataKey: string;
  color: string;
}

interface TooltipPayloadProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipPayloadProps): React.ReactElement | null {
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }
  const omzet = payload.find((entry) => entry.dataKey === "omzet");
  const pesanan = payload.find((entry) => entry.dataKey === "pesanan");
  return (
    <div className="rounded-xl border border-gold/30 bg-cream-soft px-3 py-2 shadow-warm">
      <p className="text-xs font-semibold text-brown/70">
        {formatAxisDate(label)}
      </p>
      {omzet ? (
        <p className="mt-1 text-sm font-bold tabular-nums text-brown-deep">
          Omzet: {formatRupiah(omzet.value)}
        </p>
      ) : null}
      {pesanan ? (
        <p className="text-sm font-semibold tabular-nums text-brown/75">
          Pesanan: {pesanan.value}
        </p>
      ) : null}
    </div>
  );
}

export function RevenueAreaChart({ data }: { data: DailySeriesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-gold/25 bg-white/30 text-sm text-brown/55 md:h-[300px]">
        Belum ada transaksi pada periode ini.
      </div>
    );
  }

  // Satu titik data (mis. periode "Hari Ini" sebelum ada transaksi lain):
  // area monotone collapse di tepi kiri dan terlihat rusak — tampilkan
  // kartu angka tunggal yang jelas sebagai gantinya.
  const singlePoint = data.length === 1 ? data[0] : undefined;
  if (singlePoint !== undefined) {
    const point = singlePoint;
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gold/25 bg-gold/5 md:h-[300px]">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brown/55">
          {formatAxisDate(point.date)}
        </span>
        <span className="font-serif text-3xl font-bold tabular-nums text-brown-deep">
          {formatRupiah(point.omzet)}
        </span>
        <span className="text-sm font-semibold text-brown/70">
          {point.pesanan} pesanan
        </span>
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="omzetFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartPalette.gold} stopOpacity={0.38} />
              <stop offset="55%" stopColor={chartPalette.gold} stopOpacity={0.14} />
              <stop offset="100%" stopColor={chartPalette.gold} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartPalette.brownDeep}
            strokeOpacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fill: chartPalette.brown, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chartPalette.brownDeep, strokeOpacity: 0.12 }}
            minTickGap={0}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="omzet"
            tickFormatter={formatCompactRupiah}
            tick={{ fill: chartPalette.gold, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <YAxis
            yAxisId="pesanan"
            orientation="right"
            allowDecimals={false}
            tick={{ fill: chartPalette.brown, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: chartPalette.gold, strokeOpacity: 0.25, strokeWidth: 1 }}
          />
          <Area
            yAxisId="omzet"
            type="monotone"
            dataKey="omzet"
            stroke={chartPalette.gold}
            strokeWidth={2.5}
            fill="url(#omzetFill)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#FFFFFF",
              stroke: chartPalette.gold,
              strokeWidth: 2.5,
            }}
          />
          <Line
            yAxisId="pesanan"
            type="monotone"
            dataKey="pesanan"
            stroke={chartPalette.brown}
            strokeWidth={1.75}
            strokeDasharray="4 4"
            strokeLinecap="round"
            dot={false}
            activeDot={{
              r: 4,
              fill: "#FFFFFF",
              stroke: chartPalette.brown,
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
