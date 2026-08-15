import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

// Urutan state machine. Lihat docs/04_BUSINESS_FLOW.md §4.3.
const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "BARU", label: "Pesanan Diterima" },
  { status: "DIKONFIRMASI", label: "Dikonfirmasi" },
  { status: "DIPROSES", label: "Diproses" },
  { status: "DIKIRIM", label: "Dikirim" },
  { status: "SELESAI", label: "Selesai" },
];

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  if (status === "BATAL") {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
        <X aria-hidden="true" className="size-4" strokeWidth={2.25} />
        Pesanan dibatalkan
      </p>
    );
  }

  const currentIndex = TIMELINE_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step.status} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:flex-row sm:w-full">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  isDone
                    ? "border-gold bg-gold text-brown-deep"
                    : "border-gold/30 bg-cream text-brown/40",
                )}
              >
                {isDone ? (
                  <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
                <span className="sr-only">{isCurrent ? "(status saat ini)" : ""}</span>
              </span>
              {index < TIMELINE_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-0.5 flex-1 sm:h-0.5 sm:w-full",
                    index < currentIndex ? "bg-gold" : "bg-gold/25",
                  )}
                />
              ) : null}
            </div>
            <p
              className={cn(
                "pb-5 text-xs font-semibold leading-4 sm:pb-0 sm:pt-1.5",
                isDone ? "text-brown-deep" : "text-brown/50",
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
