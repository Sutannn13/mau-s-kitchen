import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

// Lingkaran progress SVG kecil di samping kode pesanan di stub gelap.
// 5 langkah, fill sesuai posisi. Bukan tombol, dekoratif saja.
const PIPELINE: readonly OrderStatus[] = [
  "BARU",
  "DIKONFIRMASI",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
];

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OrderProgressRing({ status }: { status: OrderStatus }) {
  if (status === "BATAL") {
    return null;
  }

  const idx = PIPELINE.indexOf(status);
  if (idx < 0) {
    return null;
  }

  const progress = (idx + 1) / PIPELINE.length;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="relative flex size-11 shrink-0 items-center justify-center"
      role="img"
      aria-label={`Langkah ${idx + 1} dari ${PIPELINE.length}`}
    >
      <svg
        viewBox="0 0 40 40"
        className="size-11 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3.5"
          className="stroke-cream/15"
        />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="stroke-gold transition-all duration-500"
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono text-[10px] font-bold tabular-nums",
          "text-cream",
        )}
      >
        {idx + 1}/{PIPELINE.length}
      </span>
    </div>
  );
}
