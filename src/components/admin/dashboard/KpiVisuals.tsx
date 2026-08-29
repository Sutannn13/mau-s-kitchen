"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";

// Aksen visual kartu KPI dashboard (docs/14 §14.0, upgrade premium
// 2026-08-23): sparkline mini 7 titik, ring progress mini, dan angka
// count-up. Semua murni SVG/motion (transform & opacity), di bawah
// MotionConfig reducedMotion="user" milik layout admin.

// ---------------------------------------------------------------------
// Count-up: angka berhitung 0 → target saat mount (replay karena KPI
// remount tiap ganti periode lewat key AnimatedSection).
// ---------------------------------------------------------------------
export function CountUp({
  value,
  format,
  duration = 0.8,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => format(Math.round(latest)));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });
    return () => {
      controls.stop();
    };
  }, [motionValue, value, duration]);

  return <motion.span>{text}</motion.span>;
}

// ---------------------------------------------------------------------
// Sparkline: polyline SVG halus (Catmull-Rom → bezier) dari deret nilai
// harian, dengan area graden lembut dan titik akhir menonjol.
// ---------------------------------------------------------------------
function buildSmoothPath(points: ReadonlyArray<{ x: number; y: number }>): string {
  if (points.length < 2) {
    return points.length === 1 ? `M ${points[0]?.x} ${points[0]?.y}` : "";
  }
  let path = `M ${points[0]?.x} ${points[0]?.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    if (!p0 || !p1 || !p2 || !p3) {
      continue;
    }
    // Catmull-Rom ke cubic bezier (tension 1/6).
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export function KpiSparkline({
  values,
  stroke = "#C79A4B",
  className,
  id,
}: {
  values: readonly number[];
  stroke?: string;
  className?: string;
  id: string;
}) {
  const W = 160;
  const H = 44;
  const PAD = 4;
  const max = Math.max(...values, 1);
  const span = W - PAD * 2;
  const step = values.length > 1 ? span / (values.length - 1) : 0;
  const points = values.map((value, index) => ({
    x: PAD + index * step,
    y: H - PAD - (value / max) * (H - PAD * 2),
  }));
  const line = buildSmoothPath(points);
  const area = `${line} L ${points[points.length - 1]?.x ?? PAD} ${H} L ${points[0]?.x ?? PAD} ${H} Z`;
  const last = points[points.length - 1];

  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.9, ease: "easeOut", delay: 0.15 },
    },
  };

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-11 w-full", className)}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} stroke="none" />
      <motion.path
        variants={draw}
        initial="hidden"
        animate="show"
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {last ? (
        <motion.circle
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 400, damping: 18 }}
          cx={last.x}
          cy={last.y}
          r={3}
          fill={stroke}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      ) : null}
    </svg>
  );
}

// ---------------------------------------------------------------------
// Ring progress mini untuk kartu "Pesanan Batal": lingkaran SVG gradien
// yang terisi sesuai persentase, angka di tengah.
// ---------------------------------------------------------------------
export function KpiRing({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const safe = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, percent))
    : 0;
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative flex h-11 items-center justify-center self-end">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="size-11">
        <defs>
          <linearGradient id="kpi-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D62828" />
            <stop offset="100%" stopColor="#C79A4B" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="#3E2318"
          strokeOpacity={0.1}
          strokeWidth={6}
        />
        <motion.circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="url(#kpi-ring)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (safe / 100) * C }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="absolute text-[9px] font-bold tabular-nums text-brown-deep">
        {Math.round(safe)}%
      </span>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
