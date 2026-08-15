"use client";

import { Download } from "lucide-react";

import { rekapToCsv } from "@/lib/rekap-csv";
import type { RekapData } from "@/lib/admin/orders";

// Unduh CSV dengan BOM UTF-8 agar rapi di Excel (docs/14 §14.5).
export function CsvDownloadButton({ rekap }: { rekap: RekapData }) {
  function handleDownload(): void {
    const csv = `\uFEFF${rekapToCsv(rekap)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rekap-mauskitchen-${rekap.dari}-sd-${rekap.sampai}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light"
    >
      <Download aria-hidden="true" className="size-4" strokeWidth={2} />
      Unduh CSV
    </button>
  );
}
