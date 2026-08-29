"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  PackageX,
  Pencil,
  Plus,
  RotateCcw,
  Star,
} from "lucide-react";

import { MenuItemEditor } from "@/components/admin/MenuItemEditor";
import { ConfirmButton } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ManagedVariant {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface ManagedAddOn {
  id: string;
  name: string;
  price: number;
}

export interface ManagedCategory {
  id: string;
  name: string;
  tagline: string;
  image: string;
  order: number;
}

export interface ManagedItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  priceLabel: string;
  image: string;
  available: boolean;
  isBestSeller: boolean;
  isAddOnItem: boolean;
  unit: "porsi" | "cup" | "item";
  sortOrder: number;
  archived: boolean;
  variants: ManagedVariant[];
  addOnIds: string[];
}

interface MenuManagerProps {
  categories: ManagedCategory[];
  items: ManagedItem[];
  addOns: ManagedAddOn[];
}

type Notice = { kind: "ok" | "err"; message: string } | null;

type EditorMode =
  | { kind: "create" }
  | { kind: "edit"; itemId: string }
  | null;

// Kelola menu lengkap (CRUD). Mengikuti §14.6 UX: tombol 44x44px, ikon+warna,
// indikator loading, konfirmasi aksi destruktif. Mutasi lewat fetch ke
// /api/admin/menu/* lalu router.refresh().
export function MenuManager({ categories, items, addOns }: MenuManagerProps) {
  const router = useRouter();
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<Notice>(null);
  const [editor, setEditor] = useState<EditorMode>(null);
  const [showAddOnPanel, setShowAddOnPanel] = useState(false);

  const allIds = items.map((item) => item.id);

  const runMutation = useCallback(
    async (
      url: string,
      method: string,
      body: unknown,
      label: string,
    ): Promise<boolean> => {
      setNotice(null);
      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body === null ? null : JSON.stringify(body),
        });
        if (!response.ok) {
          const json = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          setNotice({ kind: "err", message: json?.message ?? `Gagal: ${label}` });
          return false;
        }
        router.refresh();
        return true;
      } catch {
        setNotice({ kind: "err", message: "Periksa koneksi lalu coba lagi." });
        return false;
      }
    },
    [router],
  );

  const toggleAvailability = useCallback(
    async (ids: string[], available: boolean): Promise<void> => {
      setBusyIds(new Set(ids));
      setNotice(null);
      let failed = 0;
      await Promise.all(
        ids.map(async (itemId) => {
          const response = await fetch(`/api/admin/menu/items/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ available }),
          });
          if (!response.ok) failed += 1;
        }),
      );
      if (failed === 0) {
        setNotice({
          kind: "ok",
          message: available
            ? "Menu dibuka — pelanggan melihat perubahan maksimal 60 detik."
            : "Menu ditandai habis — pelanggan melihat perubahan maksimal 60 detik.",
        });
      } else {
        setNotice({
          kind: "err",
          message: `${failed} item gagal disimpan. Coba lagi.`,
        });
      }
      router.refresh();
      setBusyIds(new Set());
    },
    [router],
  );

  const archiveItem = useCallback(
    async (itemId: string): Promise<void> => {
      setBusyIds(new Set([itemId]));
      const ok = await runMutation(
        `/api/admin/menu/items/${itemId}`,
        "DELETE",
        null,
        "mengarsipkan item",
      );
      if (ok) {
        setNotice({ kind: "ok", message: "Item diarsipkan." });
      }
      setBusyIds(new Set());
    },
    [runMutation],
  );

  const restoreItem = useCallback(
    async (itemId: string): Promise<void> => {
      setBusyIds(new Set([itemId]));
      const ok = await runMutation(
        `/api/admin/menu/items/${itemId}`,
        "PATCH",
        { archived: false },
        "memulihkan item",
      );
      if (ok) {
        setNotice({ kind: "ok", message: "Item dipulihkan." });
      }
      setBusyIds(new Set());
    },
    [runMutation],
  );

  const allUnavailable = items.every((item) => !item.available);

  return (
    <div className="stagger-in">
      <div className="flex flex-wrap gap-2">
        {/* Aksi destruktif massal memakai konfirmasi dua langkah inline
            (A14) — bukan window.confirm yang memblokir thread UI. */}
        <ConfirmButton
          disabled={allUnavailable || busyIds.size > 0}
          onConfirm={() => {
            void toggleAvailability(allIds, false);
          }}
          label={
            <>
              <PackageX aria-hidden="true" className="size-4" strokeWidth={2} />
              Tandai Semua Habis
            </>
          }
          confirmLabel="Ya, Tandai Habis"
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-chili/50 px-4 text-sm font-bold text-chili transition-colors hover:bg-chili/10 disabled:opacity-40"
        />
        <button
          type="button"
          disabled={busyIds.size > 0 || items.every((item) => item.available)}
          onClick={() => {
            void toggleAvailability(allIds, true);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:opacity-40"
        >
          <RotateCcw aria-hidden="true" className="size-4" strokeWidth={2} />
          Buka Semua
        </button>
        <button
          type="button"
          onClick={() => setEditor({ kind: "create" })}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-brown-deep px-4 text-sm font-bold text-cream transition-colors hover:bg-brown"
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
          Tambah Item
        </button>
        <button
          type="button"
          onClick={() => setShowAddOnPanel((value) => !value)}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
          Kelola Add-on
        </button>
      </div>

      {notice ? (
        <p
          role={notice.kind === "ok" ? "status" : "alert"}
          className={cn(
            "mt-3 rounded-xl px-4 py-3 text-sm",
            notice.kind === "ok"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-chili/10 text-chili",
          )}
        >
          {notice.message}
        </p>
      ) : null}

      {showAddOnPanel ? (
        <AddOnPanel addOns={addOns} onDone={() => setShowAddOnPanel(false)} />
      ) : null}

      {categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.categoryId === category.id,
        );
        return (
          <section key={category.id} className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
                {category.name}
                <span className="ml-2 text-xs font-normal text-brown/40">
                  {category.tagline}
                </span>
              </h2>
            </div>
            <ul className="mt-3 divide-y divide-gold/15 rounded-2xl border border-gold/20 bg-cream-soft">
              {categoryItems.map((item) => {
                const isBusy = busyIds.has(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2"
                  >
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold",
                          item.available
                            ? "text-brown-deep"
                            : "text-brown/40 line-through",
                        )}
                      >
                        {item.isBestSeller ? (
                          <Star
                            aria-hidden="true"
                            className="mr-1 inline size-3.5 fill-gold text-gold align-text-bottom"
                            strokeWidth={1.75}
                          />
                        ) : null}
                        {item.name}
                        {item.isAddOnItem ? " (tambahan)" : ""}
                      </p>
                      <p className="text-xs text-brown/60">{item.priceLabel}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <IconButton
                        label="Edit"
                        disabled={isBusy}
                        onClick={() => setEditor({ kind: "edit", itemId: item.id })}
                      >
                        <Pencil className="size-4" strokeWidth={2} />
                      </IconButton>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.available}
                        disabled={isBusy}
                        onClick={() => {
                          void toggleAvailability([item.id], !item.available);
                        }}
                        className={cn(
                          "relative h-11 w-[72px] shrink-0 rounded-full transition-colors disabled:opacity-60",
                          item.available ? "bg-emerald-500" : "bg-brown/25",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brown-deep shadow transition-all",
                            item.available ? "left-[36px]" : "left-1",
                          )}
                        >
                          {isBusy ? "…" : item.available ? "ADA" : "ABIS"}
                        </span>
                        <span className="sr-only">
                          {item.available ? "Tersedia" : "Habis"} — {item.name}
                        </span>
                      </button>
                      {/* Pulihkan = langsung; Arsip (destruktif) = dua langkah (A14). */}
                      {item.archived ? (
                        <IconButton
                          label={`Pulihkan ${item.name}`}
                          disabled={isBusy}
                          onClick={() => {
                            void restoreItem(item.id);
                          }}
                        >
                          <ArchiveRestore className="size-4" strokeWidth={2} />
                        </IconButton>
                      ) : (
                        <ConfirmButton
                          aria-label={`Arsipkan ${item.name}`}
                          title="Arsip"
                          disabled={isBusy}
                          onConfirm={() => {
                            void archiveItem(item.id);
                          }}
                          label={<Archive className="size-4" strokeWidth={2} />}
                          confirmLabel="Ya, Arsip"
                          className="flex size-11 items-center justify-center rounded-full border border-gold/30 text-brown transition-colors hover:bg-gold/15 disabled:opacity-50"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
              {categoryItems.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-brown/50">
                  Belum ada item di kategori ini.
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}

      {editor ? (
        <MenuItemEditor
          mode={editor.kind}
          itemId={editor.kind === "edit" ? editor.itemId : null}
          categories={categories}
          items={items}
          addOns={addOns}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-gold/30 text-brown transition-colors hover:bg-gold/15 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function AddOnPanel({
  addOns,
  onDone,
}: {
  addOns: ManagedAddOn[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createAddOn(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const price = Number.parseInt(newPrice, 10);
      if (!newId || !newName || Number.isNaN(price) || price < 0) {
        setError("Isi ID, nama, dan harga yang valid.");
        return;
      }
      const response = await fetch("/api/admin/menu/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, name: newName, price }),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(json?.message ?? "Gagal menambah add-on.");
        return;
      }
      setNewId("");
      setNewName("");
      setNewPrice("");
      router.refresh();
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-gold/20 bg-cream-soft p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-brown-deep">Add-on Global</h3>
        <button
          type="button"
          onClick={onDone}
          className="text-xs text-brown/60 hover:text-brown-deep"
        >
          Tutup
        </button>
      </div>
      <ul className="mt-3 divide-y divide-gold/15">
        {addOns.map((addOn) => (
          <li
            key={addOn.id}
            className="flex min-h-11 items-center justify-between gap-2 py-1.5"
          >
            <span className="text-sm text-brown-deep">{addOn.name}</span>
            <span className="text-xs font-bold text-gold">
              +Rp{addOn.price.toLocaleString("id-ID")}
            </span>
          </li>
        ))}
        {addOns.length === 0 ? (
          <li className="py-4 text-center text-xs text-brown/50">
            Belum ada add-on.
          </li>
        ) : null}
      </ul>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]">
        <input
          type="text"
          placeholder="id-slug"
          value={newId}
          onChange={(event) => setNewId(event.target.value)}
          className="min-h-11 rounded-full border border-gold/30 bg-cream px-4 text-sm text-brown-deep"
        />
        <input
          type="text"
          placeholder="Nama add-on"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          className="min-h-11 rounded-full border border-gold/30 bg-cream px-4 text-sm text-brown-deep"
        />
        <input
          type="number"
          placeholder="Harga"
          value={newPrice}
          onChange={(event) => setNewPrice(event.target.value)}
          className="min-h-11 rounded-full border border-gold/30 bg-cream px-4 text-sm text-brown-deep"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void createAddOn();
          }}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep hover:bg-gold-light disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={2} />
          Tambah
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-chili">
          {error}
        </p>
      ) : null}
    </div>
  );
}
