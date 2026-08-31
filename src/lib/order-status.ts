import type { OrderStatus } from "@/types/order";

// Urutan alur hidup pesanan. Lihat docs/04_BUSINESS_FLOW.md §4.3.
const pipeline: readonly OrderStatus[] = [
  "BARU",
  "DIKONFIRMASI",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
];

const finalStatuses: readonly OrderStatus[] = ["SELESAI", "BATAL"];

// Admin boleh lompat maju ke status mana pun setelah status saat ini
// (tidak wajib maju satu-satu) dan membatalkan pesanan selama belum
// final. BR-07 (larangan batal setelah DIPROSES) berlaku untuk
// pembatalan oleh pelanggan, bukan override admin.
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) {
    return false;
  }
  if (finalStatuses.includes(from)) {
    return false;
  }
  if (to === "BATAL") {
    return true;
  }
  return pipeline.indexOf(to) > pipeline.indexOf(from);
}

// Daftar status yang bisa dipilih admin dari status saat ini; dipakai
// dropdown status di daftar pesanan (docs/14_ADMIN_DASHBOARD.md §14.2).
export function getAdminTargets(status: OrderStatus): readonly OrderStatus[] {
  return orderStatuses.filter((target) => canTransition(status, target));
}

export const statusLabels: Record<OrderStatus, string> = {
  BARU: "Baru",
  DIKONFIRMASI: "Dikonfirmasi",
  DIPROSES: "Diproses",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  BATAL: "Batal",
};

export const orderStatuses: readonly OrderStatus[] = [
  "BARU",
  "DIKONFIRMASI",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
  "BATAL",
];

export const customerHistorySteps = [
  "BARU",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
] as const;

export const customerHistoryStepLabels: Record<
  (typeof customerHistorySteps)[number],
  string
> = {
  BARU: "Diterima",
  DIPROSES: "Diproses",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
};

// Riwayat pelanggan merangkum DIKONFIRMASI ke tahap awal; tambah tahap baru
// hanya jika alur status resmi di docs/04_BUSINESS_FLOW.md berubah.
export function getCustomerHistoryStepIndex(status: OrderStatus): number {
  switch (status) {
    case "BATAL":
      return -1;
    case "BARU":
    case "DIKONFIRMASI":
      return 0;
    case "DIPROSES":
      return 1;
    case "DIKIRIM":
      return 2;
    case "SELESAI":
      return 3;
  }
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}
