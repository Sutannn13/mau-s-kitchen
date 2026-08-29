"use client";

import { Printer } from "lucide-react";

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brown-deep px-5 text-sm font-bold text-cream transition-colors hover:bg-brown"
    >
      <Printer aria-hidden="true" className="size-4" strokeWidth={2} />
      Cetak / Simpan PDF
    </button>
  );
}
