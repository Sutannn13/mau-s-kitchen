// Skeleton detail pesanan admin — meniru kartu detail: heading kembali +
// kartu identitas + rincian item + aksi status.
import { SkeletonBar, SkeletonCard, SkeletonHeading } from "@/components/admin/Skeletons";

export default function AdminOrderDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8">
      <SkeletonHeading />
      <SkeletonCard className="mt-5 min-h-[120px]">
        <SkeletonBar className="h-5 w-40" />
        <SkeletonBar className="mt-3 h-3.5 w-64 max-w-full" />
        <SkeletonBar className="mt-2 h-3.5 w-52" />
      </SkeletonCard>
      <SkeletonCard className="mt-3 min-h-[160px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 border-b border-gold/10 py-3 last:border-0">
            <SkeletonBar className="h-4 w-44" />
            <SkeletonBar className="h-4 w-16" />
          </div>
        ))}
      </SkeletonCard>
      <SkeletonCard className="mt-3 min-h-[72px]">
        <SkeletonBar className="h-10 w-full rounded-xl" />
      </SkeletonCard>
    </main>
  );
}
