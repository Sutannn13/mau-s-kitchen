import type { OrderStatus } from "@/types/order";

// State machine status pesanan. Lihat docs/04_BUSINESS_FLOW.md §4.3.
const allowedTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  BARU: ["DIKONFIRMASI", "BATAL"],
  DIKONFIRMASI: ["DIPROSES", "BATAL"],
  DIPROSES: ["DIKIRIM"],
  DIKIRIM: ["SELESAI"],
  SELESAI: [],
  BATAL: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return allowedTransitions[from].includes(to);
}

// Aksi cepat di daftar pesanan: satu status "berikutnya" paling sering
// dipakai admin (docs/14_ADMIN_DASHBOARD.md §14.2 baris 4).
const quickActionTarget: Partial<Record<OrderStatus, OrderStatus>> = {
  BARU: "DIKONFIRMASI",
  DIKONFIRMASI: "DIPROSES",
  DIPROSES: "DIKIRIM",
  DIKIRIM: "SELESAI",
};

export function getQuickActionTarget(status: OrderStatus): OrderStatus | null {
  return quickActionTarget[status] ?? null;
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

export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}
