"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackageX, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ManagedMenuItem {
  id: string;
  name: string;
  priceLabel: string;
  initialAvailable: boolean;
}

interface MenuManagerProps {
  groups: Array<{ categoryName: string; items: ManagedMenuItem[] }>;
}

// Toggle ketersediaan per item + aksi massal (docs/14 §14.4).
// Perubahan tersimpan ke menu_overrides lewat PATCH /api/menu/[itemId].
export function MenuManager({ groups }: MenuManagerProps) {
  const router = useRouter();
  const [availability, setAvailability] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      groups.flatMap((group) =>
        group.items.map((item) => [item.id, item.initialAvailable]),
      ),
    ),
  );
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const allIds = groups.flatMap((group) => group.items.map((item) => item.id));

  async function setAvailable(ids: string[], available: boolean): Promise<void> {
    setError(null);
    setNotice(null);
    setBusyIds(new Set(ids));

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`/api/menu/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ available }),
          });
          return response.ok ? null : id;
        }),
      );

      const failed = results.filter((id): id is string => id !== null);
      if (failed.length > 0) {
        setError(
          `${failed.length} item gagal disimpan. Periksa koneksi lalu coba lagi.`,
        );
      } else {
        setNotice(
          available
            ? "Menu dibuka — pelanggan melihat perubahan maksimal 60 detik."
            : "Menu ditandai habis — pelanggan melihat perubahan maksimal 60 detik.",
        );
      }

      setAvailability((previous) => {
        const next = { ...previous };
        for (const id of ids) {
          if (!failed.includes(id)) {
            next[id] = available;
          }
        }
        return next;
      });
      router.refresh();
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setBusyIds(new Set());
    }
  }

  const allUnavailable = allIds.every((id) => availability[id] === false);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={allUnavailable || busyIds.size > 0}
          onClick={() => {
            if (
              window.confirm(
                "Tandai SEMUA menu habis? Pelanggan tidak bisa memesan sementara.",
              )
            ) {
              void setAvailable(allIds, false);
            }
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-chili/50 px-4 text-sm font-bold text-chili transition-colors hover:bg-chili/10 disabled:opacity-40"
        >
          <PackageX aria-hidden="true" className="size-4" strokeWidth={2} />
          Tandai Semua Habis
        </button>
        <button
          type="button"
          disabled={busyIds.size > 0 || allIds.every((id) => availability[id])}
          onClick={() => {
            void setAvailable(allIds, true);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:opacity-40"
        >
          <RotateCcw aria-hidden="true" className="size-4" strokeWidth={2} />
          Buka Semua
        </button>
      </div>

      {notice ? (
        <p role="status" className="mt-3 rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-chili/10 px-4 py-3 text-sm text-chili">
          {error}
        </p>
      ) : null}

      {groups.map((group) => (
        <section key={group.categoryName} className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
            {group.categoryName}
          </h2>
          <ul className="mt-3 divide-y divide-gold/15 rounded-2xl border border-gold/20 bg-cream-soft">
            {group.items.map((item) => {
              const available = availability[item.id] === true;
              const isBusy = busyIds.has(item.id);
              return (
                <li
                  key={item.id}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-2"
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        available ? "text-brown-deep" : "text-brown/40 line-through",
                      )}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-brown/60">{item.priceLabel}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={available}
                    disabled={isBusy}
                    onClick={() => {
                      void setAvailable([item.id], !available);
                    }}
                    className={cn(
                      "relative h-11 w-[72px] shrink-0 rounded-full transition-colors disabled:opacity-60",
                      available ? "bg-emerald-500" : "bg-brown/25",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brown-deep shadow transition-all",
                        available ? "left-[36px]" : "left-1",
                      )}
                    >
                      {isBusy ? "…" : available ? "ADA" : "ABIS"}
                    </span>
                    <span className="sr-only">
                      {available ? "Tersedia" : "Habis"} — {item.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
