"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type RekapPreset = "hari-ini" | "7-hari" | "bulan-ini" | "custom";

interface RekapFiltersProps {
  preset: RekapPreset;
  dari: string;
  sampai: string;
}

export function RekapFilters({ preset, dari, sampai }: RekapFiltersProps) {
  const router = useRouter();
  const [range, setRange] = useState<RekapPreset>(preset);
  const [dariValue, setDariValue] = useState(dari);
  const [sampaiValue, setSampaiValue] = useState(sampai);

  function navigate(next: {
    preset?: RekapPreset;
    dari?: string;
    sampai?: string;
  }): void {
    const effPreset = next.preset ?? range;
    const effDari = next.dari ?? dariValue;
    const effSampai = next.sampai ?? sampaiValue;
    const params = new URLSearchParams({ periode: effPreset });
    if (effPreset === "custom") {
      params.set("dari", effDari);
      params.set("sampai", effSampai);
    }
    router.push(`/admin/rekap?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label
          htmlFor="rekap-periode"
          className="block text-xs font-bold uppercase tracking-wide text-brown/60"
        >
          Periode
        </label>
        <select
          id="rekap-periode"
          value={range}
          onChange={(event) => {
            const next = event.target.value as RekapPreset;
            setRange(next);
            navigate({ preset: next });
          }}
          className="mt-1 min-h-11 rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
        >
          <option value="hari-ini">Hari Ini</option>
          <option value="7-hari">7 Hari</option>
          <option value="bulan-ini">Bulan Ini</option>
          <option value="custom">Pilih tanggal</option>
        </select>
      </div>

      {range === "custom" ? (
        <>
          <div>
            <label
              htmlFor="rekap-dari"
              className="block text-xs font-bold uppercase tracking-wide text-brown/60"
            >
              Dari
            </label>
            <input
              id="rekap-dari"
              type="date"
              value={dariValue}
              onChange={(event) => {
                setDariValue(event.target.value);
              }}
              className="mt-1 min-h-11 rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
            />
          </div>
          <div>
            <label
              htmlFor="rekap-sampai"
              className="block text-xs font-bold uppercase tracking-wide text-brown/60"
            >
              Sampai
            </label>
            <input
              id="rekap-sampai"
              type="date"
              value={sampaiValue}
              onChange={(event) => {
                setSampaiValue(event.target.value);
              }}
              className="mt-1 min-h-11 rounded-xl border border-gold/30 bg-cream px-3 text-sm text-brown-deep"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              navigate({ preset: "custom", dari: dariValue, sampai: sampaiValue });
            }}
            className="min-h-11 rounded-xl bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
          >
            Terapkan
          </button>
        </>
      ) : null}
    </div>
  );
}
