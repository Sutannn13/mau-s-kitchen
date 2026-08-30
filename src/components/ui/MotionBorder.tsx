"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

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
      <motion.span
        aria-hidden="true"
        className="absolute -inset-[60%] bg-[conic-gradient(from_90deg,transparent_0deg,transparent_245deg,#E3C489_290deg,transparent_335deg)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 9, ease: "linear", repeat: Infinity }}
      />
      <div className="relative h-full rounded-[calc(2rem-1px)] bg-brown-deep">
        {children}
      </div>
    </div>
  );
}
