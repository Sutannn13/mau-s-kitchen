import type { OrderStatus, PaymentMethod } from "@/types/order";

const invoiceStatuses: readonly OrderStatus[] = [
  "DIKONFIRMASI",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
];

// Kode pesanan dipakai sebagai nomor invoice; tambahkan nomor terpisah hanya
// jika kebutuhan akuntansi kelak meminta urutan dokumen yang berbeda.
export function isInvoiceAvailable(status: OrderStatus): boolean {
  return invoiceStatuses.includes(status);
}

export function getInvoicePaymentNote(
  paymentMethod: PaymentMethod,
  status: OrderStatus,
): string {
  if (!isInvoiceAvailable(status)) {
    throw new RangeError("Invoice hanya tersedia untuk pesanan yang sudah dikonfirmasi.");
  }

  if (paymentMethod === "tunai") {
    return status === "SELESAI"
      ? "Pembayaran tunai/COD - pesanan selesai"
      : "Pembayaran tunai/COD dilakukan saat pesanan diterima";
  }

  return "Pembayaran sudah dikonfirmasi admin";
}
