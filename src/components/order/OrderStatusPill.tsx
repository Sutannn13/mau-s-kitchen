import {
  Ban,
  BadgeCheck,
  ChefHat,
  CheckCheck,
  CircleDot,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { statusLabels } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

// Pill status untuk hero gelap halaman /pesanan/[kode]. Berbeda dari
// components/admin/StatusBadge.tsx yang dipakai di atas permukaan cream:
// di sini kontras dihitung terhadap latar brown-deep→ink, jadi tone-nya
// versi terang. Selalu ikon + teks, bukan warna saja (docs/08 §a11y A8).
const pillStyles: Record<OrderStatus, string> = {
  BARU: "border-flame/40 bg-flame/15 text-flame",
  DIKONFIRMASI: "border-gold/45 bg-gold/15 text-gold-light",
  DIPROSES: "border-gold-light/45 bg-gold-light/15 text-gold-light",
  DIKIRIM: "border-rose/45 bg-rose/15 text-rose",
  SELESAI: "border-pistachio/50 bg-pistachio/20 text-pistachio",
  BATAL: "border-chili/45 bg-chili/15 text-rose",
};

const pillIcons: Record<OrderStatus, LucideIcon> = {
  BARU: CircleDot,
  DIKONFIRMASI: BadgeCheck,
  DIPROSES: ChefHat,
  DIKIRIM: Truck,
  SELESAI: CheckCheck,
  BATAL: Ban,
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const Icon = pillIcons[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm",
        pillStyles[status],
      )}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={2.25} />
      {statusLabels[status]}
    </span>
  );
}
