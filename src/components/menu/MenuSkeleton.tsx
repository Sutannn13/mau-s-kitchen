import { MenuGrid } from "@/components/menu/MenuGrid";
import { Skeleton } from "@/components/ui";

// Skeleton kartu menu (docs/08 §8.9 — "Loading menu → skeleton kartu, bukan
// spinner penuh layar"). Cermin struktur MenuCard: foto 4:5 + judul + deskripsi
// + baris harga/tombol. aria-hidden — pembaca layar melewatkan placeholder.
export function MenuCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-cream-soft shadow-warm">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function TabsBarSkeleton() {
  return (
    <div className="sticky top-[72px] z-dropdown border-b border-gold/20 bg-cream/95 py-2.5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-content gap-2 px-4 md:justify-center md:px-8">
        <Skeleton className="h-11 w-20 rounded-full" />
        <Skeleton className="h-11 w-24 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full" />
        <Skeleton className="hidden h-11 w-28 rounded-full sm:block" />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section className="py-5 md:py-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 md:mb-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-52" />
      </div>
      <MenuGrid>
        {Array.from({ length: 8 }, (_, index) => (
          <MenuCardSkeleton key={index} />
        ))}
      </MenuGrid>
    </section>
  );
}

// Skeleton halaman /menu: judul + tab + grid. Layoutnya cermin page.tsx agar
// tidak ada layout shift saat konten asli menggantikan skeleton (A7).
export function MenuSkeleton() {
  return (
    <main className="pb-6 md:pb-16">
      <div className="mx-auto w-full max-w-content px-4 pb-4 pt-6 md:px-8 md:pb-6 md:pt-12">
        <Skeleton className="h-9 w-56 md:h-11 md:w-72" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <TabsBarSkeleton />
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <SectionSkeleton />
      </div>
    </main>
  );
}

// Skeleton halaman /menu/[kategori]: tab + satu seksi (tanpa blok judul halaman).
export function KategoriSkeleton() {
  return (
    <main className="pb-6 md:pb-16">
      <TabsBarSkeleton />
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <SectionSkeleton />
      </div>
    </main>
  );
}
