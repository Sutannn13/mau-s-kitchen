import { statusLabels } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

// Warna badge status + ikon agar tidak bergantung warna saja
// (docs/14 §14.2 tabel warna, §14.6 butir 3).
const badgeStyles: Record<OrderStatus, string> = {
  BARU: "bg-flame/20 text-[#8a5a00]",
  DIKONFIRMASI: "bg-blue-100 text-blue-800",
  DIPROSES: "bg-orange-100 text-orange-800",
  DIKIRIM: "bg-purple-100 text-purple-800",
  SELESAI: "bg-emerald-100 text-emerald-800",
  BATAL: "bg-chili/15 text-chili",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold",
        badgeStyles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
