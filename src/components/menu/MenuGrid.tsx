import type { ReactNode } from "react";

interface MenuGridProps {
  children: ReactNode;
}

// Grid menu 1/2/2/3/4 kolom sesuai breakpoint. Lihat docs/08_UI_UX_SPEC.md §8.1.
export function MenuGrid({ children }: MenuGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
