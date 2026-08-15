import type { RekapData } from "@/lib/admin/orders";

// Pemisah koma + UTF-8 BOM agar rapi dibuka Excel (docs/14 §14.5).
// Murni tanpa dependensi server sehingga bisa dipakai komponen client.
export function rekapToCsv(rekap: RekapData): string {
  const header = [
    "kode",
    "tanggal",
    "nama",
    "status",
    "metode_bayar",
    "subtotal",
    "ongkir",
    "total",
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
      order.total,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [
    `Ringkasan ${rekap.dari} s.d. ${rekap.sampai}`,
    `Total pesanan,${rekap.totalPesanan}`,
    `Pesanan selesai,${rekap.pesananSelesai}`,
    `Pesanan batal,${rekap.pesananBatal}`,
    `Omzet,${rekap.omzet}`,
    `Rata-rata per transaksi,${rekap.rataRataTransaksi}`,
    "",
    header.join(","),
    ...lines,
  ].join("\r\n");
}
