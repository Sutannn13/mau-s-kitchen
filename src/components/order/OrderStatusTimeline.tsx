import {
  BadgeCheck,
  Check,
  ChefHat,
  CircleDot,
  PartyPopper,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

// Urutan state machine. Lihat docs/04_BUSINESS_FLOW.md §4.3.
// Deskripsi ditulis sependek mungkin (2-4 kata) supaya kolom desktop tidak
// pecah, dan tetap informatif saat timeline menumpuk vertikal di seluler.
const TIMELINE_STEPS: ReadonlyArray<{
  status: OrderStatus;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    status: "BARU",
    label: "Pesanan Diterima",
    description: "Menunggu konfirmasi admin",
    icon: CircleDot,
  },
  {
    status: "DIKONFIRMASI",
    label: "Dikonfirmasi",
    description: "Pesanan & ongkir disepakati",
    icon: BadgeCheck,
  },
  {
    status: "DIPROSES",
    label: "Diproses",
    description: "Dimasak fresh untukmu",
    icon: ChefHat,
  },
  {
    status: "DIKIRIM",
    label: "Dikirim",
    description: "Menuju lokasimu",
    icon: Truck,
  },
  {
    status: "SELESAI",
    label: "Selesai",
    description: "Selamat menikmati!",
    icon: PartyPopper,
  },
];

interface OrderStatusTimelineProps {
  status: OrderStatus;
  /**
   * Deskripsi langkah ditulis dengan suara pelanggan ("Dimasak fresh untukmu"),
   * jadi dashboard admin mematikannya agar panelnya tetap padat & netral.
   */
  showDescriptions?: boolean;
}

export function OrderStatusTimeline({
  status,
  showDescriptions = true,
}: OrderStatusTimelineProps) {
  if (status === "BATAL") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl sm:rounded-2xl border border-danger/30 bg-danger/[0.08] p-3 sm:p-4">
        <span className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
          <X aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-danger">Pesanan dibatalkan</p>
          <p className="mt-0.5 text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown/80">
            Kalau ini tidak sesuai, hubungi admin lewat WhatsApp ya.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.findIndex((step) => step.status === status);
  const lastIndex = TIMELINE_STEPS.length - 1;
  const currentStep = TIMELINE_STEPS[currentIndex];

  return (
    <div>
      <ol className="flex flex-col sm:flex-row sm:items-start">
        {TIMELINE_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isReached = index <= currentIndex;
          const StepIcon = step.icon;
          return (
            <li
              key={step.status}
              className="animate-reveal motion-reduce:animate-none flex flex-1 gap-2.5 sm:flex-col sm:gap-2.5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex flex-col items-center sm:w-full sm:flex-row">
                <span className="relative flex shrink-0 items-center justify-center">
                  {isCurrent ? (
                    <span
                      aria-hidden="true"
                      className="animate-halo motion-reduce:animate-none absolute inset-0 rounded-full bg-gold"
                    />
                  ) : null}
                  <span
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "relative flex size-7 sm:size-9 items-center justify-center rounded-full border transition-colors",
                      isReached
                        ? "border-transparent bg-gradient-to-br from-gold-light to-gold text-brown-deep shadow-[0_6px_16px_-6px_rgba(199,154,75,0.9)]"
                        : "border-gold/35 bg-cream text-brown/50",
                    )}
                  >
                    {isDone ? (
                      <Check aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2.75} />
                    ) : (
                      <StepIcon
                        aria-hidden="true"
                        className="size-3.5 sm:size-4"
                        strokeWidth={isCurrent ? 2.5 : 2}
                      />
                    )}
                  </span>
                </span>
                {index < lastIndex ? (
                  <span
                    aria-hidden="true"
                    className="relative my-0.5 w-0.5 flex-1 overflow-hidden rounded-full bg-gold/20 sm:my-0 sm:ml-2 sm:h-0.5 sm:w-full sm:flex-1"
                  >
                    {index < currentIndex ? (
                      <span
                        className="rail-fill motion-reduce:animate-none absolute inset-0 rounded-full bg-gradient-to-b from-gold-light to-gold sm:bg-gradient-to-r"
                        style={{ animationDelay: `${index * 70 + 160}ms` }}
                      />
                    ) : null}
                  </span>
                ) : null}
              </div>
              <div
                className={cn(
                  "min-w-0 sm:pb-0 sm:pr-3",
                  showDescriptions ? "pb-3 sm:pb-6" : "pb-2 sm:pb-4",
                )}
              >
                {/* Kontras teks dijaga >=4.5:1 di atas cream-soft (WCAG AA) —
                    hierarki dibawa warna dot + bobot font, bukan teks pudar. */}
                <p
                  className={cn(
                    "text-xs sm:text-sm font-semibold sm:font-bold leading-4 sm:leading-5",
                    isReached ? "text-brown-deep" : "text-brown/80",
                  )}
                >
                  {step.label}
                  {isCurrent ? (
                    <span className="sr-only"> (status saat ini)</span>
                  ) : null}
                </p>
                {showDescriptions ? (
                  <p className="mt-0.5 text-[11px] sm:text-xs leading-4 sm:leading-5 text-brown/80">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {currentStep ? (
        <p className="mt-1 border-t border-gold/15 pt-2.5 sm:pt-4 text-[11px] sm:text-xs font-semibold text-brown/80 sm:mt-4">
          Langkah{" "}
          <span className="tabular-nums text-brown-deep">
            {currentIndex + 1} dari {TIMELINE_STEPS.length}
          </span>{" "}
          · {currentStep.label}
        </p>
      ) : null}
    </div>
  );
}
