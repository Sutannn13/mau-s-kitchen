import Image from "next/image";
import Link from "next/link";
import { Menu as MenuIcon, ShoppingBag } from "lucide-react";

import { CartBadge } from "@/components/layout/CartBadge";

const navigationItems = [
  { href: "/", label: "Beranda" },
  { href: "/menu", label: "Menu" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-content items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-full pr-3"
          aria-label="Kembali ke beranda MAU'S Kitchen"
        >
          <Image
            src="/assets/brand/logo-maus-kitchen.jpeg"
            alt="Logo MAU'S Kitchen dengan ornamen daun dan bingkai emas"
            width={48}
            height={48}
            className="size-12 rounded-full border border-gold/30 object-cover"
          />
          <span className="font-serif text-lg font-bold tracking-tight text-brown-deep sm:text-xl">
            MAU&apos;S Kitchen
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 md:flex"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15 hover:text-brown-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/keranjang"
            className="relative flex size-11 items-center justify-center rounded-full text-brown-deep transition-colors hover:bg-gold/15"
            aria-label="Buka keranjang"
          >
            <ShoppingBag aria-hidden="true" className="size-5" strokeWidth={1.75} />
            <CartBadge />
          </Link>

          <details className="group relative md:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-brown-deep transition-colors hover:bg-gold/15 [&::-webkit-details-marker]:hidden">
              <MenuIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
              <span className="sr-only">Buka menu navigasi</span>
            </summary>
            <nav
              aria-label="Navigasi seluler"
              className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-gold/25 bg-cream-soft p-2 shadow-warm-lg"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15 hover:text-brown-deep"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
