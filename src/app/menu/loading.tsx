import { KitchenLoader } from "@/components/common/KitchenLoader";
import { MenuSkeleton } from "@/components/menu/MenuSkeleton";

// Skeleton selama segmen /menu dirender (docs/08 §8.9 — A7), dibuka momen
// brand KitchenLoader di atas agar masa tunggu terasa "dapur sedang
// menyiapkan" — skeleton grid tetap memandu struktur halaman.
export default function LoadingMenu() {
  return (
    <>
      <div className="flex justify-center px-4 pt-8 md:pt-10">
        <KitchenLoader label="Memuat menu" />
      </div>
      <MenuSkeleton />
    </>
  );
}
