"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, UtensilsCrossed, History, ShoppingBag, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CartBadge } from "@/components/layout/CartBadge";
import { cn } from "@/lib/utils";

// Navigasi bawah mobile persisten (docs/08 §8.7 — A2). Lima item utama;
// item Keranjang memakai CartBadge. Hanya tampil < md dan hanya di-render
// untuk rute non-admin (lihat app/layout.tsx). z-sticky = 50, safe-area inset
// bawah. FAB diangkat ke atas batang ini pada seluler (WhatsAppFab.tsx).
//
// Transisi perpindahan tab (docs/08 §8.3): pill emas aktif meluncur antar
// item (layoutId — pola yang sama dengan AdminSidebar), ikon memantul
// singkat saat menjadi aktif, dan seluruh item mengecil halus saat ditekan
// (whileTap). Semuanya otomatis nonaktif untuk prefers-reduced-motion
// lewat MotionConfig di ChromeShell.
const MotionLink = motion.create(Link);

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
              <MotionLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-cart-target={item.badge ? "" : undefined}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition-colors",
                  active
                    ? "text-brown-deep"
                    : "text-brown/70 hover:text-brown-deep",
                )}
              >
                {active ? (
                  // Pill aktif Warm Luxe — meluncur mengikuti rute aktif.
                  <motion.span
                    aria-hidden="true"
                    layoutId="mobile-nav-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-x-2 inset-y-1.5 rounded-full bg-gold/20 ring-1 ring-inset ring-gold/30"
                  />
                ) : null}
                <motion.span
                  animate={
                    active
                      ? { scale: [1, 1.18, 1], y: [0, -2, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.75}
                  />
                  {item.badge ? <CartBadge /> : null}
                </motion.span>
                <span className="relative">{item.label}</span>
              </MotionLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
