"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

// Angka naik dari 0 ke target saat masuk viewport. Pakai requestAnimationFrame
// untuk smooth, bukan setInterval. Berhenti saat reduced-motion (tampilkan
// nilai akhir langsung).
export function CountUp({
  end,
  duration = 1500,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (shouldReduceMotion) {
      // Gunakan requestAnimationFrame untuk menghindari setState langsung
      // dalam effect body (eslint react-hooks/set-state-in-effect)
      const rafId = requestAnimationFrame(() => setCount(end));
      return () => cancelAnimationFrame(rafId);
    }

    let rafId: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, end, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
