// Skeleton kelola menu admin — heading + kartu filter tab kategori +
// placeholder grid item menu.
import { SkeletonBar, SkeletonCard, SkeletonHeading } from "@/components/admin/Skeletons";

export default function AdminMenuLoading() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8">
      <SkeletonHeading />
      <SkeletonCard className="mt-4 min-h-[64px]">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <SkeletonBar key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </SkeletonCard>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} className="min-h-[120px]">
            <div className="flex items-start justify-between gap-3">
              <SkeletonBar className="h-5 w-36" />
              <SkeletonBar className="h-6 w-16" />
            </div>
            <SkeletonBar className="mt-3 h-3.5 w-full max-w-[280px]" />
            <SkeletonBar className="mt-2 h-3.5 w-24" />
          </SkeletonCard>
        ))}
      </div>
    </main>
  );
}
