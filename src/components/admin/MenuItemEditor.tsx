"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUp, X } from "lucide-react";

import type {
  ManagedAddOn,
  ManagedCategory,
  ManagedItem,
  ManagedVariant,
} from "@/components/admin/MenuManager";
import { Dialog } from "@/components/ui";
import { cn } from "@/lib/utils";

interface MenuItemEditorProps {
  mode: "create" | "edit";
  itemId: string | null;
  categories: ManagedCategory[];
  items: ManagedItem[];
  addOns: ManagedAddOn[];
  onClose: () => void;
}

interface EditorVariant {
  id: string;
  name: string;
  price: string;
}

type Tab = "detail" | "variants" | "addons" | "photo";

// Editor item menu: Detail / Varian / Add-on / Foto. Mengikuti §14.6 UX:
// tombol 44x44px, loading, konfirmasi. Mutasi via fetch + router.refresh().
export function MenuItemEditor({
  mode,
  itemId,
  categories,
  items,
  addOns,
  onClose,
}: MenuItemEditorProps) {
  const router = useRouter();
  const existing = mode === "edit" ? items.find((item) => item.id === itemId) : null;

  const [tab, setTab] = useState<Tab>("detail");
  const [id, setId] = useState(existing?.id ?? "");
  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? categories[0]?.id ?? "",
  );
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [basePrice, setBasePrice] = useState(
    existing ? String(existing.basePrice) : "",
  );
  const [unit, setUnit] = useState<ManagedItem["unit"]>(existing?.unit ?? "porsi");
  const [isBestSeller, setIsBestSeller] = useState(existing?.isBestSeller ?? false);
  const [isAddOnItem, setIsAddOnItem] = useState(existing?.isAddOnItem ?? false);
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? 0));
  const [variants, setVariants] = useState<EditorVariant[]>(
    existing?.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: String(variant.price),
    })) ?? [],
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    new Set(existing?.addOnIds ?? []),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function addVariant(): void {
    setVariants((current) => [
      ...current,
      { id: `varian-${current.length + 1}`, name: "", price: "" },
    ]);
  }

  function updateVariant(index: number, patch: Partial<EditorVariant>): void {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    );
  }

  function removeVariant(index: number): void {
    setVariants((current) => current.filter((_, i) => i !== index));
  }

  function toggleAddOn(addOnId: string): void {
    setSelectedAddOnIds((current) => {
      const next = new Set(current);
      if (next.has(addOnId)) {
        next.delete(addOnId);
      } else {
        next.add(addOnId);
      }
      return next;
    });
  }

  async function handleSave(): Promise<void> {
    setError(null);

    const trimmedId = id.trim();
    if (mode === "create" && !/^[a-z0-9-]+$/.test(trimmedId)) {
      setError("ID hanya boleh huruf kecil, angka, dan strip.");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    const price = Number.parseInt(basePrice, 10);
    if (Number.isNaN(price) || price < 0) {
      setError("Harga dasar tidak valid.");
      return;
    }
    if (!categoryId) {
      setError("Pilih kategori.");
      return;
    }

    const variantPayload: ManagedVariant[] = variants
      .filter((variant) => variant.name.trim())
      .map((variant) => ({
        id: variant.id.trim(),
        name: variant.name.trim(),
        price: Number.parseInt(variant.price, 10) || 0,
        sortOrder: 0,
      }));

    const variantIds = new Set(variantPayload.map((variant) => variant.id));
    if (variantIds.size !== variantPayload.length) {
      setError("ID varian tidak boleh duplikat.");
      return;
    }

    const payload = {
      ...(mode === "create"
        ? {
            id: trimmedId,
            categoryId,
            name: name.trim(),
            description: description.trim(),
            basePrice: price,
            unit,
            isBestSeller,
            isAddOnItem,
            sortOrder: Number.parseInt(sortOrder, 10) || 0,
            variants: variantPayload,
            addOnIds: [...selectedAddOnIds],
          }
        : {
            name: name.trim(),
            description: description.trim(),
            basePrice: price,
            unit,
            isBestSeller,
            isAddOnItem,
            sortOrder: Number.parseInt(sortOrder, 10) || 0,
            variants: variantPayload,
            addOnIds: [...selectedAddOnIds],
          }),
    };

    setBusy(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/menu/items"
          : `/api/admin/menu/items/${itemId}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(json?.message ?? "Gagal menyimpan item.");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadImage(file: File): Promise<void> {
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/menu/items/${itemId}/image`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(json?.message ?? "Gagal mengunggah foto.");
        return;
      }
      router.refresh();
      setNotice("Foto diperbarui.");
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "detail", label: "Detail" },
    { id: "variants", label: "Varian" },
    { id: "addons", label: "Tambahan" },
    { id: "photo", label: "Foto" },
  ];

  // Modal memakai Dialog bersama (A3): role=dialog + aria-modal + focus trap
  // + Esc + pemulihan fokus + scroll lock — semua dari useDialogA11y, sama
  // dengan ProductSheet pelanggan.
  return (
    <Dialog
      onClose={onClose}
      title={
        mode === "create" ? "Tambah Item Baru" : `Edit: ${existing?.name ?? itemId}`
      }
      panelClassName="flex max-h-[90vh] flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex gap-1 border-b border-gold/20 px-5">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "min-h-11 px-4 text-sm font-semibold transition-colors",
                tab === entry.id
                  ? "border-b-2 border-gold text-brown-deep"
                  : "text-brown/60 hover:text-brown-deep",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "detail" ? (
            <div className="space-y-3">
              {mode === "create" ? (
                <Field label="ID (slug)">
                  <input
                    type="text"
                    value={id}
                    onChange={(event) => setId(event.target.value)}
                    placeholder="mis. taichan-ayam"
                    className="w-full rounded-full border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                  />
                </Field>
              ) : null}
              <Field label="Kategori">
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full rounded-full border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nama">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-full border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                />
              </Field>
              <Field label="Deskripsi">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-2xl border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Harga Dasar (Rp)">
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(event) => setBasePrice(event.target.value)}
                    className="w-full rounded-full border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                  />
                </Field>
                <Field label="Satuan">
                  <select
                    value={unit}
                    onChange={(event) =>
                      setUnit(event.target.value as ManagedItem["unit"])
                    }
                    className="w-full rounded-full border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                  >
                    <option value="porsi">porsi</option>
                    <option value="cup">cup</option>
                    <option value="item">item</option>
                  </select>
                </Field>
              </div>
              <Field label="Urutan Tampil">
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="w-full rounded-full border border-gold/30 bg-cream-soft px-4 py-2.5 text-sm text-brown-deep"
                />
              </Field>
              <div className="flex gap-4">
                <label className="flex min-h-11 items-center gap-2 text-sm text-brown-deep">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(event) => setIsBestSeller(event.target.checked)}
                    className="size-4 accent-gold"
                  />
                  Best Seller
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm text-brown-deep">
                  <input
                    type="checkbox"
                    checked={isAddOnItem}
                    onChange={(event) => setIsAddOnItem(event.target.checked)}
                    className="size-4 accent-gold"
                  />
                  Item Tambahan
                </label>
              </div>
            </div>
          ) : null}

          {tab === "variants" ? (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    type="text"
                    value={variant.id}
                    onChange={(event) =>
                      updateVariant(index, { id: event.target.value })
                    }
                    placeholder="id"
                    className="rounded-full border border-gold/30 bg-cream-soft px-3 py-2 text-sm text-brown-deep"
                  />
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(event) =>
                      updateVariant(index, { name: event.target.value })
                    }
                    placeholder="Nama varian"
                    className="rounded-full border border-gold/30 bg-cream-soft px-3 py-2 text-sm text-brown-deep"
                  />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(index, { price: event.target.value })
                      }
                      placeholder="Harga"
                      className="w-24 rounded-full border border-gold/30 bg-cream-soft px-3 py-2 text-sm text-brown-deep"
                    />
                    <button
                      type="button"
                      aria-label="Hapus varian"
                      onClick={() => removeVariant(index)}
                      className="flex size-9 items-center justify-center rounded-full border border-chili/30 text-chili hover:bg-chili/10"
                    >
                      <X className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className="flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown hover:bg-gold/15"
              >
                + Tambah Varian
              </button>
            </div>
          ) : null}

          {tab === "addons" ? (
            <div className="space-y-2">
              {addOns.length === 0 ? (
                <p className="text-sm text-brown/60">
                  Belum ada add-on global. Tambahkan lewat tombol &ldquo;Kelola Add-on&rdquo;.
                </p>
              ) : (
                addOns.map((addOn) => (
                  <label
                    key={addOn.id}
                    className="flex min-h-11 items-center gap-2 rounded-xl border border-gold/20 bg-cream-soft px-4 text-sm text-brown-deep"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddOnIds.has(addOn.id)}
                      onChange={() => toggleAddOn(addOn.id)}
                      className="size-4 accent-gold"
                    />
                    {addOn.name}
                    <span className="ml-auto text-xs font-bold text-gold">
                      +Rp{addOn.price.toLocaleString("id-ID")}
                    </span>
                  </label>
                ))
              )}
            </div>
          ) : null}

          {tab === "photo" ? (
            <div className="space-y-3">
              {existing?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={existing.image}
                  alt={existing.name}
                  className="aspect-square w-full rounded-2xl border border-gold/20 object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-gold/20 bg-cream-soft text-xs text-brown/50">
                  Belum ada foto
                </div>
              )}
              {mode === "edit" ? (
                <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep hover:bg-gold-light">
                  <ImageUp className="size-4" strokeWidth={2} />
                  Unggah Foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleUploadImage(file);
                      }
                    }}
                  />
                </label>
              ) : (
                <p className="text-xs text-brown/60">
                  Simpan item dulu, lalu unggah foto dari tab ini.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {notice ? (
          <p role="status" className="px-5 pb-2 text-xs text-emerald-700">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="px-5 pb-2 text-xs text-chili">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 border-t border-gold/20 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-11 items-center justify-center rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown hover:bg-gold/15"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void handleSave();
            }}
            className="flex-1 flex min-h-11 items-center justify-center rounded-full bg-brown-deep px-4 text-sm font-bold text-cream hover:bg-brown disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-brown/60">
        {label}
      </span>
      {children}
    </label>
  );
}
