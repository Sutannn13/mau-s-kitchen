// Format kode pesanan MK-YYMMDD-XXX (zona Asia/Jakarta).
// Lihat docs/10_DATA_MODEL.md §10.6 dan docs/16_TESTING_QA.md §16.2.
const ORDER_CODE_PATTERN = /^MK-\d{6}-\d{3}$/;

export function isValidOrderCode(value: string): boolean {
  return ORDER_CODE_PATTERN.test(value);
}

export function buildOrderCode(date: Date, sequence: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const partValue = (type: string): string => {
    const part = parts.find((item) => item.type === type);
    if (!part) {
      throw new Error(`Bagian tanggal ${type} tidak ditemukan.`);
    }
    return part.value;
  };

  return `MK-${partValue("year")}${partValue("month")}${partValue("day")}-${String(
    sequence,
  ).padStart(3, "0")}`;
}
