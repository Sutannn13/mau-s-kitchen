"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, History, ShoppingBag, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CartBadge } from "@/components/layout/CartBadge";
import { cn } from "@/lib/utils";

// Navigasi bawah mobile persisten (docs/08 §8.7 — A2). Lima item utama;
// item Keranjang memakai CartBadge. Hanya tampil < md dan hanya di-render
// untuk rute non-admin (lihat app/layout.tsx). z-sticky = 50, safe-area inset
// bawah. FAB diangkat ke atas batang ini pada seluler (WhatsAppFab.tsx).
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/pesanan", label: "Pesanan", icon: History },
  { href: "/keranjang", label: "Keranjang", icon: ShoppingBag, badge: true },
  { href: "/kontak", label: "Kontak", icon: MessageCircle },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileBottomBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-gold/20 bg-cream/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-content items-stretch justify-between px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-cart-target={item.badge ? "" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition-colors",
                  active
                    ? "text-brown-deep"
                    : "text-brown/70 hover:text-brown-deep",
                )}
              >
                <span className="relative">
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.75}
                  />
                  {item.badge ? <CartBadge /> : null}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
