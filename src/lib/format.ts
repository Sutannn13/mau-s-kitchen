const idNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  useGrouping: true,
});

export function formatRupiah(value: number): string {
  // Seluruh uang berupa integer rupiah tanpa pembulatan atau pecahan.
  // Lihat docs/05_MENU_CATALOG.md §5.6 dan docs/10_DATA_MODEL.md §10.5.
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Nilai rupiah harus berupa integer non-negatif.");
  }

  return "Rp" + idNumberFormatter.format(value);
}
