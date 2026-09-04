import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// WARM LUXE ADMIN PRIMITIVES (docs/08 §8.11, upgrade 2026-09-04)
// Primitif premium khusus panel admin: kartu berlapis gradien, header
// halaman terpadu, dan segmented control pill. Semuanya memakai token
// --au-* di globals.css — TIDAK ada hex mentah di sini.
// ---------------------------------------------------------------------------

export interface AdminCardProps extends HTMLAttributes<HTMLElement> {
  /** Animasi hover lift + shadow besar (default true). */
  hoverable?: boolean;
  /** Sembunyikan padding default (p-5) — konten mengatur sendiri. */
  unpadded?: boolean;
  as?: "div" | "section" | "article" | "li";
}

/** Kartu konten premium: gradien permukaan + border ganda + shadow luxe. */
export function AdminCard({
  hoverable = true,
  unpadded = false,
  as = "section",
  className,
  children,
  ...props
}: AdminCardProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        "au-card rounded-2xl",
        hoverable && "au-card-hover",
        !unpadded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface AdminPanelHeaderProps {
  title: string;
  desc?: string;
  /** Aksi kanan (tombol, switcher, dsb.) — otomatis shrink-0. */
  action?: ReactNode;
  className?: string;
}

/** Header panel kartu: judul serif + deskripsi + aksi kanan. */
export function AdminPanelHeader({
  title,
  desc,
  action,
  className,
}: AdminPanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-3 border-b border-gold/15 pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-serif text-lg font-bold tracking-tight text-brown-deep">
          {title}
        </h2>
        {desc ? (
          <p className="mt-1 text-xs leading-5 text-brown/60">{desc}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export interface AdminPageHeaderProps {
  title: string;
  desc?: ReactNode;
  /** Slot kanan untuk aksi utama (tombol, periode switcher, dsb.). */
  action?: ReactNode;
  className?: string;
}

/** Header halaman admin terpadu: judul serif besar + deskripsi + aksi. */
export function AdminPageHeader({
  title,
  desc,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
          {title}
        </h1>
        {desc ? (
          <p className="mt-1.5 text-sm leading-6 text-brown/70">{desc}</p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 sm:pb-1">{action}</div>
      ) : null}
    </div>
  );
}

export interface StatTileProps {
  label: string;
  value: string;
  /** Ikon di chip kiri atas — dirender dalam kotak gradien emas. */
  icon?: ReactNode;
  hint?: string;
  /** Tone aksen: gold (default), success, warning, danger. */
  tone?: "gold" | "success" | "warning" | "danger";
  className?: string;
}

const toneChipClass: Record<NonNullable<StatTileProps["tone"]>, string> = {
  gold: "bg-gradient-to-br from-gold/35 to-gold/10 text-gold ring-gold/25",
  success: "bg-gradient-to-br from-pistachio/25 to-pistachio/10 text-success ring-pistachio/25",
  warning: "bg-gradient-to-br from-flame/25 to-flame/10 text-flame ring-flame/25",
  danger: "bg-gradient-to-br from-chili/20 to-chili/10 text-chili ring-chili/25",
};

/** Tile statistik ringkas untuk baris atas halaman Pesanan/Rekap. */
export function StatTile({
  label,
  value,
  icon,
  hint,
  tone = "gold",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "au-card au-card-hover rounded-2xl p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
              toneChipClass[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
        <p className="min-w-0 truncate text-xs font-semibold text-brown/60">
          {label}
        </p>
      </div>
      <p className="mt-2.5 font-serif text-xl font-bold tabular-nums tracking-tight text-brown-deep md:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-brown/55">{hint}</p> : null}
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** id untuk a11y — wajib unik bila >1 instance di halaman. */
  idPrefix: string;
  className?: string;
  size?: "default" | "sm";
}

/**
 * Segmented control pill premium — latar inset lembut, item aktif
 * terangkat dengan shadow luxe + ring emas. Dipakai untuk switcher
 * periode (dashboard) dan preset filter (rekap/pesanan).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  idPrefix,
  className,
  size = "default",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={idPrefix}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-brown/8 p-1 ring-1 ring-inset ring-brown/10",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onChange(option.value);
            }}
            className={cn(
              "min-h-9 rounded-full font-semibold transition-all duration-200",
              size === "sm" ? "px-3 text-xs" : "px-4 text-sm",
              active
                ? "bg-cream-soft text-brown-deep shadow-luxe ring-1 ring-gold/40"
                : "text-brown/60 hover:text-brown-deep",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
