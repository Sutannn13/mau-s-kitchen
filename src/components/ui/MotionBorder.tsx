import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MotionBorderProps {
  children: ReactNode;
  className?: string;
}

// Garis aksen bergerak bergaya Motion/Magic UI tanpa paket tambahan.
// Span selalu dirender (mencegah hydration mismatch); animasi dimatikan
// via MotionConfig reducedMotion="user" yang di-set di MotionProvider.
export function MotionBorder({ children, className }: MotionBorderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] bg-brown-deep p-px shadow-warm-lg",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[2rem] border border-gold/30"
      />
      <div className="relative h-full rounded-[calc(2rem-1px)] bg-brown-deep">
        {children}
      </div>
    </div>
  );
}
