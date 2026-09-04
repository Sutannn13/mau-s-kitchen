"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  ChevronUp,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { useDialogA11y } from "@/components/ui/useDialogA11y";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

// Lebar sidebar desktop. --sidebar-w (di :root globals.css) default ke
// EXPANDED_WIDTH; saat admin menciutkan sidebar, useCollapsed() memutakhirkan
// variabel itu agar padding konten layout ikut mengecil.
const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 78;
const STORAGE_KEY = "maus-admin:sidebar-collapsed";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  desc: string;
}

// Grup navigasi Warm Luxe: OPERASIONAL (alur harian) dipisah dari
// ANALITIK (pembacaan kinerja) — scan-ability lebih baik daripada
// daftar datar 4 item.
const navGroups: readonly { label: string; items: readonly NavItem[] }[] = [
  {
    label: "Operasional",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, desc: "Ringkasan hari ini" },
      { href: "/admin/pesanan", label: "Pesanan", icon: Inbox, desc: "Konfirmasi & proses" },
      { href: "/admin/menu", label: "Kelola Menu", icon: UtensilsCrossed, desc: "Katalog & harga" },
    ],
  },
  {
    label: "Analitik",
    items: [
      { href: "/admin/rekap", label: "Rekap", icon: BarChart3, desc: "Laporan penjualan" },
    ],
  },
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
      className="group flex items-center gap-3"
      aria-label="Beranda dashboard admin MAU'S Kitchen"
    >
      <span className="relative shrink-0">
        <Image
          src="/assets/brand/logo-maus-kitchen.jpeg"
          alt="Logo MAU'S Kitchen"
          width={44}
          height={44}
          className="size-11 rounded-2xl border border-gold/40 object-cover shadow-gold-glow"
        />
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-2xl bg-gold/10 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-base font-bold text-cream">
          MAU&apos;S Kitchen
        </span>
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold/70">
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
        className="size-11 rounded-2xl border border-gold/40 object-cover shadow-gold-glow"
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
          : "text-cream/60 hover:bg-white/[0.06] hover:text-cream",
      )}
    >
      {active ? (
        // Pill aktif Warm Luxe: gradien emas + glow + ring, meluncur antar
        // item saat rute berubah (layout animation).
        <motion.span
          aria-hidden="true"
          layoutId={pillId}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="absolute inset-0 rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(199,154,75,0.24) 0%, rgba(199,154,75,0.08) 100%)",
            boxShadow:
              "0 0 0 1px rgba(217,179,106,0.28), 0 4px 16px rgba(199,154,75,0.16)",
          }}
        />
      ) : null}
      {/* Rail aksen emas di sisi kiri item aktif — penanda premium. */}
      {active ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-gold-light to-gold shadow-gold-glow"
        />
      ) : null}
      <Icon
        aria-hidden="true"
        className={cn(
          "relative size-5 shrink-0 transition-colors",
          active ? "text-gold" : "text-cream/50 group-hover:text-cream/75",
        )}
        strokeWidth={1.75}
      />
      {collapsed ? null : (
        <span className="relative flex flex-col leading-tight">
          <span>{item.label}</span>
          <span
            className={cn(
              "text-[11px] font-medium",
              active ? "text-cream/55" : "text-cream/35",
            )}
          >
            {item.desc}
          </span>
        </span>
      )}
      {collapsed ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-cocoa-900 px-2 py-1 text-xs font-medium text-cream shadow-warm-lg group-hover:block group-focus-visible:block"
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
    <nav
      aria-label="Navigasi admin"
      className="flex flex-1 flex-col gap-4 overflow-y-auto"
    >
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? null : (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/30">
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              pillId={pillId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      <Link
        href="/"
        onClick={onNavigate}
        title={collapsed ? "Lihat Situs Pelanggan" : undefined}
        aria-label={collapsed ? "Lihat Situs Pelanggan" : undefined}
        className={cn(
          "group relative mt-1 flex min-h-11 items-center rounded-xl text-sm font-semibold text-cream/50 transition-colors hover:bg-white/[0.06] hover:text-cream/80",
          collapsed ? "justify-center px-0" : "gap-3 px-3",
        )}
      >
        <ExternalLink
          aria-hidden="true"
          className="size-4 shrink-0 text-cream/40"
          strokeWidth={1.75}
        />
        {collapsed ? null : "Lihat Situs Pelanggan"}
        {collapsed ? (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-cocoa-900 px-2 py-1 text-xs font-medium text-cream shadow-warm-lg group-hover:block group-focus-visible:block"
          >
            Lihat Situs Pelanggan
          </span>
        ) : null}
      </Link>
    </nav>
  );
}

/**
 * Kartu profil premium dengan menu pop-up (bukan sekadar blok statis):
 * klik kartu membuka menu kecil berisi identitas + tombol keluar.
 * Menu ditutup dengan klik luar / Escape / blur — pola dropdown ringan
 * tanpa dependensi Radix baru.
 */
function ProfileCard({ email, collapsed }: { email: string; collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (
    <span
      aria-hidden="true"
      className="au-glass-chip flex size-10 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-bold text-gold-light"
    >
      {adminInitial(email)}
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span title={email}>{initial}</span>
        <CollapsedLogoutIconButton />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="au-glass-chip flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:border-gold/30"
      >
        {initial}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-cream">
            {siteConfig.name}
          </span>
          <span className="block truncate text-xs text-cream/45">{email}</span>
        </span>
        <ChevronUp
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-cream/40 transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Menu akun admin"
          className="absolute bottom-full left-0 z-dropdown mb-2 w-full overflow-hidden rounded-2xl border border-gold/20 bg-cocoa-850 p-1.5 shadow-warm-lg"
        >
          <div className="flex items-center gap-2 px-2.5 py-2">
            <ShieldCheck
              aria-hidden="true"
              className="size-4 shrink-0 text-gold/80"
              strokeWidth={1.75}
            />
            <p className="text-xs font-medium text-cream/60">
              Sesi terverifikasi
            </p>
          </div>
          <div aria-hidden="true" className="my-1 border-t border-gold/10" />
          <ProfileLogoutMenuItem
            onAfterNavigate={() => {
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProfileLogoutMenuItem({ onAfterNavigate }: { onAfterNavigate?: () => void }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsBusy(true);
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );
      await supabase.auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={isBusy}
      onClick={() => {
        void handleLogout().finally(() => onAfterNavigate?.());
      }}
      className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-cream/70 outline-none transition-colors hover:bg-chili/15 hover:text-cream focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-60"
    >
      <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
      {isBusy ? "Keluar…" : "Keluar"}
    </button>
  );
}

function CollapsedLogoutIconButton() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsBusy(true);
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );
      await supabase.auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleLogout();
      }}
      disabled={isBusy}
      aria-label="Keluar"
      title="Keluar"
      className="flex size-10 items-center justify-center rounded-xl text-cream/60 transition-colors hover:bg-chili/15 hover:text-cream disabled:opacity-60"
    >
      <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
    </button>
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
        "group relative flex min-h-10 items-center rounded-xl text-xs font-semibold text-cream/45 transition-colors hover:bg-white/[0.06] hover:text-cream/75",
        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      {collapsed ? null : "Ciutkan panel"}
      {collapsed ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-cocoa-900 px-2 py-1 text-xs font-medium text-cream shadow-warm-lg group-hover:block group-focus-visible:block"
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
        "flex h-full flex-col gap-5",
        collapsed ? "p-3.5" : "p-5",
      )}
    >
      {collapsed ? <CollapsedBrand /> : <ExpandedBrand onNavigate={onNavigate} />}
      <NavLinks
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
      <div className="flex flex-col gap-2">
        {onToggle ? (
          <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
        ) : null}
        <ProfileCard email={email} collapsed={collapsed} />
        {collapsed ? null : (
          <p className="px-1 text-[10px] font-medium tracking-wide text-cream/25">
            MAU&apos;S Kitchen Admin · v1.0
          </p>
        )}
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
        className="fixed inset-0 z-40 bg-cocoa-950/60 backdrop-blur-sm"
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
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col shadow-warm-lg outline-none",
          "animate-drawer-in motion-reduce:animate-none",
        )}
        style={{
          background: "linear-gradient(180deg, #1d110b 0%, #140b07 100%)",
        }}
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

      {/* Sidebar desktop — fixed, latar gelap premium Warm Luxe (token
          --au-chrome-bg). Lebar diatur lewat variabel --sidebar-w (juga
          dipakai layout untuk offset konten) sehingga saat menciut/melebar,
          padding konten ikut transisi. */}
      <aside
        aria-label="Navigasi admin"
        className={cn(
          "hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:flex-col lg:border-r lg:overflow-hidden",
          "lg:transition-[width] lg:duration-200 lg:ease-out",
        )}
        style={{
          width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          background: "linear-gradient(180deg, #1d110b 0%, #140b07 100%)",
          borderRight: "1px solid rgba(217, 179, 106, 0.14)",
        }}
      >
        {/* Glow ambient emas di puncak sidebar — aksen premium halus. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
        />
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
