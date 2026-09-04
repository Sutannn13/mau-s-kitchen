"use client";

import { usePathname } from "next/navigation";
import { Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

// Topbar desktop Warm Luxe: glass sticky dengan judul halaman dinamis +
// breadcrumb + chip waktu. Sebelumnya topbar hanya ada di seluler; versi
// desktop memberi orientasi konteks (di halaman apa admin berada) tanpa
// harus melihat sidebar — pola dashboard premium modern (Linear/Stripe).

interface Crumb {
  label: string;
}

// Peta judul halaman — pathname admin hanya segmen pertama (detail pesanan
// menyusul sebagai crumb kedua dengan kode pesanan).
function resolveCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] === "admin"
  if (segments.length <= 1) {
    return [{ label: "Dashboard" }];
  }
  const section = segments[1] ?? "";
  const sectionLabels: Record<string, string> = {
    pesanan: "Pesanan",
    menu: "Kelola Menu",
    rekap: "Rekap",
  };
  const crumbs: Crumb[] = [{ label: sectionLabels[section] ?? "Admin" }];
  const detailCode = segments[2] ?? "";
  if (section === "pesanan" && detailCode) {
    crumbs.push({ label: detailCode });
  }
  return crumbs;
}

export function AdminTopbar() {
  const pathname = usePathname();
  const crumbs = resolveCrumbs(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden lg:flex lg:h-16 lg:items-center lg:justify-between lg:gap-4 lg:border-b lg:px-8",
      )}
      style={{
        background: "rgba(251, 246, 240, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(199, 154, 75, 0.2)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Breadcrumb: Panel / Seksi / (kode pesanan) */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brown/40">
            Panel
          </span>
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-brown/25">
                /
              </span>
              <span
                className={
                  index === crumbs.length - 1
                    ? "truncate font-serif text-sm font-bold text-brown-deep"
                    : "truncate text-xs font-semibold text-brown/55"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pistachio/10 px-3 py-1.5 text-[11px] font-bold text-success ring-1 ring-inset ring-pistachio/25">
          <span className="relative flex size-1.5">
            <span
              aria-hidden="true"
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none"
            />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
        <span className="hidden items-center gap-1.5 rounded-full bg-brown/8 px-3 py-1.5 text-[11px] font-semibold text-brown/60 ring-1 ring-inset ring-brown/10 xl:inline-flex">
          <Clock3 aria-hidden="true" className="size-3.5" strokeWidth={2} />
          Asia/Jakarta
        </span>
      </div>
    </header>
  );
}
