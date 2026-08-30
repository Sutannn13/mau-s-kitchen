"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  href: string;
  strength?: number;
}

// Tombol sedikit mengikuti cursor saat hover — magnetic effect.
// Gerak hanya beberapa pixel (default 0.3), tidak berlebihan.
// Berhenti total saat reduced-motion. Tetap memakai Next.js Link
// untuk client-side navigation dan prefetching.
const MotionLink = motion.create(Link);

export function MagneticButton({
  children,
  className,
  href,
  strength = 0.3,
}: MagneticButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <MotionLink
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn("btn-press", className)}
    >
      {children}
    </MotionLink>
  );
}
