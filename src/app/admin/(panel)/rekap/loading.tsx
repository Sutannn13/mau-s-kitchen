// Skeleton rekap admin — heading + kartu filter + 5 metrik + tabel rekap.
import { SkeletonBar, SkeletonCard, SkeletonHeading } from "@/components/admin/Skeletons";

export default function AdminRekapLoading() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <SkeletonHeading />
        <SkeletonCard className="mt-4 min-h-[96px]" />
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="min-h-[84px]">
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="mt-2 h-6 w-16" />
            </SkeletonCard>
          ))}
        </div>
        <SkeletonCard className="mt-4 min-h-[180px]" />
      </div>
    </main>
  );
}
