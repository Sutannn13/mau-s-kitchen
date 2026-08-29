import { KitchenLoader } from "@/components/common/KitchenLoader";
import { KategoriSkeleton } from "@/components/menu/MenuSkeleton";

// Skeleton selama segmen /menu/[kategori] dirender (docs/08 §8.9 — A7),
// dibuka momen brand KitchenLoader di atas, sama pola dengan /menu.
export default function LoadingKategori() {
  return (
    <>
      <div className="flex justify-center px-4 pt-8 md:pt-10">
        <KitchenLoader label="Memuat kategori" />
      </div>
      <KategoriSkeleton />
    </>
  );
}
