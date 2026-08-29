import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Mood Badge — memetakan ke palet brand (docs/06) agar konsisten lintas
// kategori/status. Selalu icon+text — BUKAN warna-saja (A8 a11y).
export type BadgeTone =
  | "neutral"
  | "taichan"
  | "minuman"
  | "choco"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-brown/10 text-brown-deep",
  taichan: "bg-flame/20 text-brown-deep",
  minuman: "bg-info/15 text-info",
  choco: "bg-choco/15 text-choco",
  gold: "bg-gold/15 text-brown-deep",
  success: "bg-pistachio/25 text-[#5f6b1f]",
  warning: "bg-warning/15 text-warning",
  danger: "bg-chili/15 text-chili",
  info: "bg-info/15 text-info",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  outlined?: boolean;
}

export function Badge({
  tone = "neutral",
  outlined = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        toneClass[tone],
        outlined && "border border-current/30",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
