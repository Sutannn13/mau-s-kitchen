import {
  Ban,
  Check,
  CheckCheck,
  CircleDot,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { statusLabels } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

// Badge status pesanan: token brand (A8) + ikon agar tidak bergantung warna
// saja (docs/14 §14.2, §14.6 butir 3). String status & logika canTransition
// di server tidak tersentuh — pemetaan ini visual semata.
const badgeStyles: Record<OrderStatus, string> = {
  BARU: "bg-flame/20 text-brown-deep",
  DIKONFIRMASI: "bg-info/15 text-info",
  DIPROSES: "bg-gold/20 text-brown-deep",
  DIKIRIM: "bg-brown/15 text-brown-deep",
  SELESAI: "bg-success/15 text-success",
  BATAL: "bg-chili/15 text-chili",
};

const statusIcons: Record<OrderStatus, LucideIcon> = {
  BARU: CircleDot,
  DIKONFIRMASI: Check,
  DIPROSES: UtensilsCrossed,
  DIKIRIM: Truck,
  SELESAI: CheckCheck,
  BATAL: Ban,
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const Icon = statusIcons[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-7 sm:min-h-8 items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold",
        badgeStyles[status],
      )}
    >
      <Icon aria-hidden="true" className="size-3 sm:size-3.5" strokeWidth={2.25} />
      {statusLabels[status]}
    </span>
  );
}
