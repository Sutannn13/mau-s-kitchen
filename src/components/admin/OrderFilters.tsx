"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { statusLabels, orderStatuses } from "@/lib/order-status";

// Filter daftar pesanan: rentang tanggal, status, pencarian
// (docs/14 §14.2 "Filter"). Form GET sederhana agar filter tersimpan di URL.
function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00+07:00`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

type RangePreset = "hari-ini" | "7-hari" | "bulan-ini" | "semua" | "custom";

interface OrderFiltersProps {
  currentRange: RangePreset;
  currentDari: string;
  currentSampai: string;
  currentStatus: string;
  currentQuery: string;
}

export function OrderFilters({
  currentRange,
  currentDari,
  currentSampai,
  currentStatus,
  currentQuery,
}: OrderFiltersProps) {
  const router = useRouter();
  const [range, setRange] = useState<RangePreset>(currentRange);
  const [dari, setDari] = useState(currentDari);
  const [sampai, setSampai] = useState(currentSampai);

  function apply(next: {
    range?: RangePreset;
    dari?: string;
    sampai?: string;
    status?: string;
  }): void {
    const effRange = next.range ?? range;
    const effDari = next.dari ?? dari;
    const effSampai = next.sampai ?? sampai;

    const params = new URLSearchParams();
    const today = jakartaToday();

    if (effRange === "hari-ini") {
      params.set("dari", today);
      params.set("sampai", today);
    } else if (effRange === "7-hari") {
      params.set("dari", addDays(today, -6));
      params.set("sampai", today);
    } else if (effRange === "bulan-ini") {
      params.set("dari", `${today.slice(0, 7)}-01`);
      params.set("sampai", today);
    } else if (effRange === "custom") {
      if (effDari) params.set("dari", effDari);
      if (effSampai) params.set("sampai", effSampai);
    }

    if (effRange !== "semua") {
      params.set("rentang", effRange);
    }

    const status = next.status ?? currentStatus;
    if (status) {
      params.set("status", status);
    }
    const query = currentQuery.trim();
    if (query) {
      params.set("q", query);
    }

    router.push(`/admin/pesanan?${params.toString()}`);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label
          htmlFor="filter-rentang"
          className="block text-xs font-bold uppercase tracking-wide text-brown/60"
        >
          Rentang
        </label>
        <select
          id="filter-rentang"
          value={range}
          onChange={(event) => {
            const next = event.target.value as RangePreset;
            setRange(next);
            apply({ range: next });
          }}
          className="mt-1 min-h-11 w-full rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
        >
          <option value="hari-ini">Hari Ini</option>
          <option value="7-hari">7 Hari</option>
          <option value="bulan-ini">Bulan Ini</option>
          <option value="custom">Pilih tanggal</option>
          <option value="semua">Semua</option>
        </select>
      </div>

      {range === "custom" ? (
        <>
          <div>
            <label
              htmlFor="filter-dari"
              className="block text-xs font-bold uppercase tracking-wide text-brown/60"
            >
              Dari
            </label>
            <input
              id="filter-dari"
              type="date"
              value={dari}
              onChange={(event) => {
                setDari(event.target.value);
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
            />
          </div>
          <div>
            <label
              htmlFor="filter-sampai"
              className="block text-xs font-bold uppercase tracking-wide text-brown/60"
            >
              Sampai
            </label>
            <input
              id="filter-sampai"
              type="date"
              value={sampai}
              onChange={(event) => {
                setSampai(event.target.value);
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                apply({ range: "custom", dari, sampai });
              }}
              className="min-h-11 w-full rounded-xl bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
            >
              Terapkan Tanggal
            </button>
          </div>
        </>
      ) : null}

      <div>
        <label
          htmlFor="filter-status"
          className="block text-xs font-bold uppercase tracking-wide text-brown/60"
        >
          Status
        </label>
        <select
          id="filter-status"
          value={currentStatus}
          onChange={(event) => {
            apply({ status: event.target.value });
          }}
          className="mt-1 min-h-11 w-full rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
        >
          <option value="">Semua</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-2">
        <label
          htmlFor="filter-q"
          className="block text-xs font-bold uppercase tracking-wide text-brown/60"
        >
          Cari kode / nama
        </label>
        <form
          className="mt-1 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const input = (
              event.currentTarget.elements.namedItem("q") as HTMLInputElement
            ).value;
            const params = new URLSearchParams(window.location.search);
            params.set("q", input);
            router.push(`/admin/pesanan?${params.toString()}`);
          }}
        >
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={currentQuery}
            placeholder="MK-… atau nama"
            className="min-h-11 w-full rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
          />
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
          >
            Cari
          </button>
        </form>
      </div>
    </div>
  );
}
