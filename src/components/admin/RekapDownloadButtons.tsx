"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

import type { RekapData } from "@/lib/admin/orders";
import { rekapToCsv } from "@/lib/rekap-csv";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function RekapDownloadButtons({ rekap }: { rekap: RekapData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filenameBase = `rekap-mauskitchen-${rekap.dari}-sd-${rekap.sampai}`;

  async function handleExcelDownload(): Promise<void> {
    setIsGenerating(true);
    setError(null);

    try {
      // Library spreadsheet dimuat saat diminta agar bundle awal tetap ringan.
      const { rekapToXlsx } = await import("@/lib/rekap-xlsx");
      const workbook = await rekapToXlsx(rekap);
      downloadBlob(
        new Blob([workbook], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${filenameBase}.xlsx`,
      );
    } catch {
      setError("Laporan Excel gagal dibuat. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCsvDownload(): void {
    setError(null);
    const csv = `\uFEFF${rekapToCsv(rekap)}`;
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${filenameBase}.csv`,
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExcelDownload}
          disabled={isGenerating}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-65"
        >
          <FileSpreadsheet
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
          {isGenerating ? "Membuat Excel..." : "Unduh Excel"}
        </button>
        <button
          type="button"
          onClick={handleCsvDownload}
          disabled={isGenerating}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-gold/35 bg-cream-soft px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold/10 disabled:opacity-65"
        >
          <Download aria-hidden="true" className="size-4" strokeWidth={2} />
          CSV Mentah
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
