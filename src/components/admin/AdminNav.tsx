"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/admin/LogoutButton";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/rekap", label: "Rekap" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-[72px] z-40 border-b border-gold/20 bg-cream/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-2 px-4 py-2 md:px-8">
        <nav aria-label="Navigasi admin" className="flex items-center gap-1">
          {adminLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-gold/25 text-brown-deep"
                    : "text-brown/80 hover:bg-gold/15 hover:text-brown-deep",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton />
      </div>
    </div>
  );
}
