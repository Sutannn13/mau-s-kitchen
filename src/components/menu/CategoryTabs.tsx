import Link from "next/link";

import { menu } from "@/lib/menu";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types/menu";

type ActiveTab = "semua" | CategoryId;

interface CategoryTabsProps {
  active: ActiveTab;
}

// Sticky tepat di bawah header 72px; z-40 agar berada di bawah header (z-50).
export function CategoryTabs({ active }: CategoryTabsProps) {
  const categories = [...menu.categories].sort((a, b) => a.order - b.order);

  // Di /menu tab kategori memakai hash agar scroll mulus ke section
  // (docs/07_INFORMATION_ARCHITECTURE.md §7.2); di halaman kategori
  // memakai rute penuh dan "Semua" kembali ke /menu.
  const tabs: Array<{ id: ActiveTab; label: string; href: string }> = [
    { id: "semua", label: "Semua", href: "/menu" },
    ...categories.map((category) => ({
      id: category.id as ActiveTab,
      label: category.name,
      href: active === "semua" ? `#${category.id}` : `/menu/${category.id}`,
    })),
  ];

  return (
    <div className="sticky top-[72px] z-40 border-b border-gold/20 bg-cream/95 backdrop-blur-xl">
      <nav aria-label="Kategori menu" className="mx-auto w-full max-w-content">
        <ul className="flex gap-2 overflow-x-auto px-4 py-2.5 md:justify-center md:px-8">
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
