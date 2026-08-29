"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/admin/LogoutButton";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

// Lebar sidebar desktop. --sidebar-w (di :root globals.css) default ke
// EXPANDED_WIDTH; saat admin menciutkan sidebar, useCollapsed() memutakhirkan
// variabel itu agar padding konten layout ikut mengecil.
const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;
const STORAGE_KEY = "maus-admin:sidebar-collapsed";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pesanan", label: "Pesanan", icon: Inbox },
  { href: "/admin/menu", label: "Kelola Menu", icon: UtensilsCrossed },
  { href: "/admin/rekap", label: "Rekap", icon: BarChart3 },
];

function isActive(pathname: string, href: string): boolean {
  // "/admin" adalah prefix dari semua rute admin — pakai kecocokan persis
  // untuk Dashboard, sisanya pakai startsWith agar detail pesanan ikut aktif.
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function adminInitial(email: string): string {
  const match = email.trim().match(/^([A-Za-z0-9])/);
  return match?.[1]?.toUpperCase() ?? "A";
}

// Event kustom: toggle mendispatch event agar semua instance
// useSyncExternalStore membaca ulang localStorage (sumber kebenaran).
const COLLAPSE_EVENT = "maus-admin:sidebar-collapsed";

function subscribeToCollapse(onStoreChange: () => void): () => void {
  window.addEventListener(COLLAPSE_EVENT, onStoreChange);
  return () => window.removeEventListener(COLLAPSE_EVENT, onStoreChange);
}

// Snapshot primitif (boolean) — stabil, aman dari render berantai.
function getCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// Server selalu merender expanded → render hidrasi klien cocok dengan HTML
// tanpa error hydration mismatch; nilai localStorage diambil setelah hidrasi.
function getCollapsedServerSnapshot(): boolean {
  return false;
}

function useCollapsed(): readonly [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribeToCollapse,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  // Sinkronisasi variabel CSS --sidebar-w dengan state (desktop). Layout
  // (panel) membaca var ini untuk offset padding konten.
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.style.setProperty(
      "--sidebar-w",
      `${collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}px`,
    );
  }, [collapsed]);

  const toggle = () => {
    const next = !getCollapsedSnapshot();
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* abaikan kegagalan penyimpanan preferensi */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  return [collapsed, toggle] as const;
}

function ExpandedBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className="flex items-center gap-3"
      aria-label="Beranda dashboard admin MAU'S Kitchen"
    >
      <Image
        src="/assets/brand/logo-maus-kitchen.jpeg"
        alt="Logo MAU'S Kitchen"
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full border border-gold/40 object-cover"
      />
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-base font-bold text-cream">
          MAU&apos;S Kitchen
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">
          Panel Admin
        </span>
      </span>
    </Link>
  );
}

function CollapsedBrand() {
  return (
    <Link
      href="/admin"
      aria-label="Beranda dashboard admin MAU'S Kitchen"
      className="flex justify-center"
    >
      <Image
        src="/assets/brand/logo-maus-kitchen.jpeg"
        alt="Logo MAU'S Kitchen"
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full border border-gold/40 object-cover"
      />
    </Link>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  // layoutId pill aktif — harus unik per surface (desktop vs drawer seluler)
  // agar layout animation tidak bentrok antar dua instance NavLinks.
  pillId: string;
  onNavigate?: () => void;
}

function NavLink({ item, active, collapsed, pillId, onNavigate }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex min-h-11 items-center rounded-xl text-sm font-semibold transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "text-cream"
          : "text-cream/70 hover:bg-white/5 hover:text-cream",
      )}
    >
      {active ? (
        // Pill aktif meluncur antar item navigasi saat rute berubah
        // (layout animation, pola sama dengan PeriodeSwitcher dashboard).
        <motion.span
          aria-hidden="true"
          layoutId={pillId}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="absolute inset-0 rounded-xl bg-gold/15 ring-1 ring-inset ring-gold/30"
        />
      ) : null}
      <Icon
        aria-hidden="true"
        className={cn(
          "relative size-5 shrink-0",
          active ? "text-gold" : "text-cream/60",
        )}
        strokeWidth={1.75}
      />
      {collapsed ? null : <span className="relative">{item.label}</span>}
      {collapsed ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-brown-deep px-2 py-1 text-xs font-medium text-cream shadow-warm-lg group-hover:block group-focus-visible:block"
        >
          {item.label}
        </span>
      ) : null}
    </Link>
  );
}

interface NavLinksProps {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavLinks({ pathname, collapsed, onNavigate }: NavLinksProps) {
  const pillId = useId();
  return (
    <nav aria-label="Navigasi admin" className="flex flex-1 flex-col gap-1">
      {collapsed ? null : (
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/40">
          Navigasi
        </p>
      )}
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          collapsed={collapsed}
          pillId={pillId}
          onNavigate={onNavigate}
        />
      ))}

      <Link
        href="/"
        onClick={onNavigate}
        title={collapsed ? "Lihat Situs Pelanggan" : undefined}
        aria-label={collapsed ? "Lihat Situs Pelanggan" : undefined}
        className={cn(
          "group relative mt-2 flex min-h-11 items-center rounded-xl text-sm font-semibold text-cream/55 transition-colors hover:bg-white/5 hover:text-cream/80",
          collapsed ? "justify-center px-0" : "gap-3 px-3",
        )}
      >
        <ExternalLink
          aria-hidden="true"
          className="size-4 shrink-0 text-cream/45"
          strokeWidth={1.75}
        />
        {collapsed ? null : "Lihat Situs Pelanggan"}
        {collapsed ? (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-brown-deep px-2 py-1 text-xs font-medium text-cream shadow-warm-lg group-hover:block group-focus-visible:block"
          >
            Lihat Situs Pelanggan
          </span>
        ) : null}
      </Link>
    </nav>
  );
}

interface ProfileBlockProps {
  email: string;
  collapsed: boolean;
}

function ProfileBlock({ email, collapsed }: ProfileBlockProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/20 font-serif text-lg font-bold text-gold"
          title={email}
        >
          {adminInitial(email)}
        </span>
        <LogoutButton
          iconOnly
          className="w-full justify-center text-cream/80 hover:bg-gold/15 hover:text-cream"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/20 font-serif text-lg font-bold text-gold"
        >
          {adminInitial(email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cream">
            {siteConfig.name}
          </p>
          <p className="truncate text-xs text-cream/50">{email}</p>
        </div>
      </div>
      <LogoutButton className="mt-3 w-full justify-center text-cream/80 hover:bg-gold/15 hover:text-cream" />
    </div>
  );
}

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
      aria-expanded={!collapsed}
      title={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
      className={cn(
        "group relative flex min-h-11 items-center rounded-xl text-sm font-semibold text-cream/60 transition-colors hover:bg-white/5 hover:text-cream",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
      {collapsed ? null : "Ciutkan"}
      {collapsed ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-brown-deep px-2 py-1 text-xs font-medium text-cream shadow-warm-lg group-hover:block group-focus-visible:block"
        >
          Lebarkan sidebar
        </span>
      ) : null}
    </button>
  );
}

interface SidebarContentProps {
  pathname: string;
  email: string;
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

function SidebarContent({
  pathname,
  email,
  collapsed,
  onToggle,
  onNavigate,
}: SidebarContentProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-6",
        collapsed ? "p-3" : "p-5",
      )}
    >
      {collapsed ? <CollapsedBrand /> : <ExpandedBrand onNavigate={onNavigate} />}
      <NavLinks
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
      <div className="flex flex-col gap-1">
        {onToggle ? (
          <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
        ) : null}
        <ProfileBlock email={email} collapsed={collapsed} />
      </div>
    </div>
  );
}

// Drawer seluler sebagai komponen terpisah agar useDialogA11y (A6) berjalan
// tepat saat buka: fokus masuk drawer, trap Tab, pulihkan fokus ke pemicu saat
// tutup, kunci scroll body. Esc tetap juga ditangani listener window di induk.
function AdminMobileDrawer({
  email,
  pathname,
  onClose,
}: {
  email: string;
  pathname: string;
  onClose: () => void;
}) {
  const { dialogRef, handleKeyDown } = useDialogA11y({ onClose });

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Tutup menu navigasi admin"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-brown-deep/55 backdrop-blur-sm"
      />
      <div
        id="admin-drawer"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi admin"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-gradient-to-b from-choco to-brown-deep shadow-warm-lg outline-none",
          "animate-drawer-in motion-reduce:animate-none",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-cream/70 transition-colors hover:bg-white/10 hover:text-cream"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
        <SidebarContent
          pathname={pathname}
          email={email}
          collapsed={false}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useCollapsed();

  // Tutup drawer dengan tombol Escape. Penutupan saat pindah rute ditangani
  // lewat onClick tiap link (onNavigate) — bukan effect — agar tidak
  // memicu render berantai (react-hooks/set-state-in-effect).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Bilah atas seluler — sticky, menempati ruang aliran di atas konten. */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-gold/20 bg-cream/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Buka menu navigasi admin"
          aria-expanded={isOpen}
          aria-controls="admin-drawer"
          className="flex size-11 items-center justify-center rounded-full text-brown-deep transition-colors hover:bg-gold/15"
        >
          <MenuIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2">
          <Image
            src="/assets/brand/logo-maus-kitchen.jpeg"
            alt="Logo MAU'S Kitchen"
            width={32}
            height={32}
            className="rounded-full border border-gold/30 object-cover"
          />
          <span className="font-serif text-base font-bold text-brown-deep">
            Admin
          </span>
        </div>
        <div className="w-11" aria-hidden="true" />
      </header>

      {/* Sidebar desktop — fixed, latar gelap premium. Lebar diatur lewat
          variabel --sidebar-w (juga dipakai layout untuk offset konten)
          sehingga saat menciut/melebar, padding konten ikut transisi. */}
      <aside
        aria-label="Navigasi admin"
        className={cn(
          "hidden bg-gradient-to-b from-choco to-brown-deep lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-gold/15",
          "lg:transition-[width] lg:duration-200 lg:ease-out lg:overflow-hidden",
        )}
        style={{
          width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        }}
      >
        <SidebarContent
          pathname={pathname}
          email={email}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </aside>

      {/* Drawer seluler — overlay + panel geluncur dari kiri (a11y dialog). */}
      {isOpen ? (
        <AdminMobileDrawer
          email={email}
          pathname={pathname}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
