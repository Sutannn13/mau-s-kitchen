"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { StoreStatus } from "@/lib/store-hours";
import { getStoreStatus } from "@/lib/store-hours";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<StoreStatus, string> = {
  open: "Buka sekarang",
  closed: "Tutup sekarang",
  unknown: "Jam dikonfirmasi via WhatsApp",
};

const STATUS_TONE: Record<StoreStatus, BadgeTone> = {
  open: "success",
  closed: "neutral",
  unknown: "neutral",
};

// Berlangganan ke "jam" sebagai store eksternal. useSyncExternalStore
// menangani perbedaan snapshot server vs klien tanpa hydration mismatch:
// server mengembalikan "unknown" (label netral, AGENTS #3 — tidak mengarang
// status), klien menghitung buka/tutup pasca-hidrasi. Refresh tiap menit agar
// badge akurat saat melintasi batas buka/tutup. (docs/08 §8.9, A5 + A8.)
const subscribe = (onStoreChange: () => void): (() => void) => {
  const timer = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(timer);
};

const getClientSnapshot = (): StoreStatus => getStoreStatus();
const getServerSnapshot = (): StoreStatus => "unknown";

export function StoreStatusBadge({ className }: { className?: string }) {
  const status = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <Badge tone={STATUS_TONE[status]} className={cn("whitespace-nowrap", className)}>
      <Clock aria-hidden="true" className="size-3.5" strokeWidth={2} />
      {STATUS_TEXT[status]}
    </Badge>
  );
}
