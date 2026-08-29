import type { RekapData } from "@/lib/admin/orders";
import {
  calculateDeliveryMargin,
  deliveryProviderLabels,
} from "@/lib/order-delivery";

export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

// CSV sengaja hanya berisi satu tabel mentah. Ringkasan, gaya, dan rumus
// tersedia pada ekspor XLSX karena format CSV tidak dapat menyimpannya.
export function rekapToCsv(rekap: RekapData): string {
  const header = [
    "Kode Pesanan",
    "Tanggal (ISO)",
    "Nama Pelanggan",
    "Status",
    "Metode Pembayaran",
    "Subtotal",
    "Ongkir Pelanggan",
    "Pengantar",
    "Biaya Kurir Aktual",
    "Selisih Ongkir",
    "Total Pesanan",
  ];
  const lines = rekap.orders.map((order) =>
    [
      order.code,
      order.createdAt,
      order.customer.name,
      order.status,
      order.paymentMethod,
      order.subtotal,
      order.deliveryFee ?? "",
      order.deliveryProvider
        ? deliveryProviderLabels[order.deliveryProvider]
        : "",
      order.courierCost ?? "",
      calculateDeliveryMargin(order.deliveryFee, order.courierCost) ?? "",
      order.total,
    ]
      .map((value) => escapeCsvCell(value))
      .join(","),
  );

  return [header.map((value) => escapeCsvCell(value)).join(","), ...lines].join(
    "\r\n",
  );
}
