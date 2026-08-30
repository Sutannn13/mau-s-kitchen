import Link from "next/link";

import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types/menu";

type ActiveTab = "semua" | string;

interface CategoryTabsProps {
  active: ActiveTab;
  categories: MenuCategory[];
}

// Sticky tepat di bawah header 72px; z-dropdown (30) agar berada di bawah
// header sticky (z-sticky = 50) menurut tangga z-index (docs/08 §8.1).
export function CategoryTabs({ active, categories }: CategoryTabsProps) {
  const sorted = [...categories].sort((a, b) => a.order - b.order);

  // Semua tab kategori memakai rute penuh /menu/{kategori} agar klik selalu
  // pindah halaman dan chip aktif ter-highlight konsisten di semua halaman
  // (permintaan pemilik); "Semua" kembali ke /menu.
  const tabs: Array<{ id: ActiveTab; label: string; href: string }> = [
    { id: "semua", label: "Semua", href: "/menu" },
    ...sorted.map((category) => ({
      id: category.id as ActiveTab,
      label: category.name,
      href: `/menu/${category.id}`,
    })),
  ];

  return (
    <div className="sticky top-[72px] z-dropdown border-b border-gold/20 bg-cream/95 backdrop-blur-xl">
      <nav aria-label="Kategori menu" className="mx-auto w-full max-w-content">
        <ul className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center md:px-8">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <li key={tab.id} className="shrink-0">
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-gold text-brown-deep"
                      : "border border-gold/30 bg-cream-soft text-brown hover:bg-gold/15 hover:text-brown-deep",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
