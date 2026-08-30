import type { ReactNode } from "react";

interface MenuGridProps {
  children: ReactNode;
}

// Dua kolom sejak 360px agar katalog mobile terasa seperti aplikasi pesan
// makanan; desktop bertambah ke 3/4 kolom. Lihat docs/08 §8.1 dan §8.3.
export function MenuGrid({ children }: MenuGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
