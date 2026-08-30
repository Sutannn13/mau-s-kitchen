"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";

import { CartBadge } from "@/components/layout/CartBadge";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Beranda" },
  { href: "/menu", label: "Menu" },
  { href: "/pesanan", label: "Pesanan" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kontak", label: "Kontak" },
] as const;

// Ikon hamburger tiga garis yang morf jadi X: garis atas/bawah berotasi
// ke tengah, garis tengah fade — sinkron dengan animasi panel navigasi.
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  const lineClass = "block h-[2px] w-5 rounded-full bg-current transition-transform duration-150";
  return (
    <span
      aria-hidden="true"
      className="relative flex size-5 flex-col items-center justify-center gap-[5px]"
    >
      <span className={cn(lineClass, isOpen && "translate-y-[7px] rotate-45")} />
      <span className={cn(lineClass, "origin-center", isOpen && "scale-x-0 opacity-0")} />
      <span className={cn(lineClass, isOpen && "-translate-y-[7px] -rotate-45")} />
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-sticky border-b border-[#EAE3DB] bg-[#F7EEE4]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-content items-center justify-between px-4 md:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full"
          aria-label="Kembali ke beranda MAU'S Kitchen"
        >
          <Image
            src="/assets/brand/logo-maus-kitchen-thumb.jpg"
            alt="Logo MAU'S Kitchen"
            width={40}
            height={40}
            unoptimized
            className="size-9 rounded-full border border-gold/40 object-cover"
          />
          <span className="font-serif text-xl font-bold tracking-tight text-brown-deep sm:text-2xl">
            MAU&apos;S Kitchen
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-6 md:flex"
        >
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-1 text-sm font-medium transition-colors hover:text-brown-deep",
                  isActive
                    ? "font-bold text-brown-deep"
                    : "text-brown/80",
                )}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-brown-deep"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons (Cart + Pesan Sekarang) */}
        <div className="flex items-center gap-3">
          <Link
            href="/keranjang"
            className="relative flex size-11 items-center justify-center rounded-full text-brown-deep transition-colors hover:bg-gold/15"
            aria-label="Buka keranjang"
            data-cart-target
          >
            <ShoppingBag aria-hidden="true" className="size-5" strokeWidth={1.75} />
            <CartBadge />
          </Link>

          <Link
            href="/menu"
            className="btn-press hidden items-center justify-center rounded-full bg-[#1A110B] px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#2E1F16] sm:inline-flex"
          >
            Pesan Sekarang
          </Link>

          {/* Mobile Hamburger Menu — disclosure custom (bukan <details>)
              supaya buka/tutup bisa dianimasi: ikon morf X + panel
              slide-fade, tutup saat pilih menu / klik di luar / Escape. */}
          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((open) => !open);
              }}
              aria-expanded={isMenuOpen}
              aria-controls={panelId}
              className="flex size-11 items-center justify-center rounded-full text-brown-deep transition-colors hover:bg-gold/15"
            >
              <HamburgerIcon isOpen={isMenuOpen} />
              <span className="sr-only">
                {isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              </span>
            </button>

              {isMenuOpen ? (
                <nav
                  id={panelId}
                  aria-label="Navigasi seluler"
                  className="absolute right-0 top-12 w-56 rounded-2xl border border-[#EAE3DB] bg-cream-soft p-2 shadow-warm-lg"
                >
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setIsMenuOpen(false);
                      }}
                      className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15 hover:text-brown-deep"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-[#EAE3DB] pt-2">
                    <Link
                      href="/menu"
                      onClick={() => {
                        setIsMenuOpen(false);
                      }}
                      className="btn-press flex min-h-11 items-center justify-center rounded-xl bg-[#1A110B] px-4 text-sm font-semibold text-white"
                    >
                      Pesan Sekarang
                    </Link>
                  </div>
                </nav>
              ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
