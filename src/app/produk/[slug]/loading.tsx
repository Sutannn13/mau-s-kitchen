import { KitchenLoader } from "@/components/common/KitchenLoader";
import { Skeleton } from "@/components/ui";

// Skeleton berbentuk halaman detail produk: breadcrumb + dua kolom
// (foto 4:5 + info). KitchenLoader diletakkan di tengah area foto agar
// momen tunggu terasa "dapur sedang menyiapkan menu"-nya.
export default function LoadingProduk() {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <Skeleton className="h-4 w-56" aria-hidden="true" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold/20 bg-cream-soft shadow-warm">
          <KitchenLoader
            label="Menyiapkan menu"
            className="absolute inset-0 justify-center"
          />
        </div>
        <div className="space-y-4" aria-hidden="true">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="mt-2 h-8 w-36" />
          <div className="space-y-3 pt-6">
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
