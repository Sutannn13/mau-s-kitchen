// Skeleton loading halaman admin — dipakai loading.tsx setiap route di
// (panel). Desain mengikuti sistem (cream-soft, border gold/20, rounded-2xl)
// supaya transisi skeleton → konten tidak "loncat"; tinggi bar mendekati
// konten asli tiap halaman. Shimmer dimatikan prefers-reduced-motion.
import { cn } from "@/lib/utils";

export function SkeletonBar({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "admin-skeleton block rounded-full bg-brown/10",
        className,
      )}
    />
  );
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-2xl border border-gold/20 bg-cream-soft p-4 shadow-warm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Baris KPI: 4 kartu (grid sama dengan halaman asli). */
export function SkeletonKpiRow() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="min-h-[118px]">
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="mt-3 h-7 w-28" />
          <SkeletonBar className="mt-3 h-3 w-16" />
        </SkeletonCard>
      ))}
    </div>
  );
}

/** Blok judul + subjudul halaman. */
export function SkeletonHeading() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <SkeletonBar className="h-8 w-44" />
        <SkeletonBar className="mt-2 h-3.5 w-72 max-w-full" />
      </div>
      <SkeletonBar className="h-9 w-40 rounded-full" />
    </div>
  );
}
