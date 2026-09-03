// Skeleton dashboard admin — meniru struktur halaman asli: heading +
// periode switcher, baris KPI 4 kolom, banner operasional, dan grid chart.
import { SkeletonCard, SkeletonHeading, SkeletonKpiRow } from "@/components/admin/Skeletons";

export default function AdminDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8">
      <SkeletonHeading />
      <div className="mt-5">
        <SkeletonKpiRow />
      </div>
      <SkeletonCard className="mt-3 min-h-[132px]" />
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonCard className="min-h-[240px]" />
        </div>
        <SkeletonCard className="min-h-[240px]" />
      </div>
    </main>
  );
}
