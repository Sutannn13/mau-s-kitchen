// Skeleton daftar pesanan admin — heading + 4 stat card + filter bar +
// placeholder kartu pesanan (meniru list `<ul class="space-y-3">`).
import { SkeletonBar, SkeletonCard, SkeletonHeading } from "@/components/admin/Skeletons";

export default function AdminPesananLoading() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
      <SkeletonHeading />
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="min-h-[84px]">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="mt-2 h-6 w-20" />
          </SkeletonCard>
        ))}
      </div>
      <SkeletonCard className="mt-4 min-h-[96px]" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="min-h-[104px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SkeletonBar className="h-5 w-28" />
              <SkeletonBar className="h-6 w-24 rounded-full" />
            </div>
            <SkeletonBar className="mt-3 h-3.5 w-56 max-w-full" />
            <SkeletonBar className="mt-2 h-3.5 w-40" />
          </SkeletonCard>
        ))}
      </div>
    </main>
  );
}
