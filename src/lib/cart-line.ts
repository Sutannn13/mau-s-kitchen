import type { MenuItem, ProductSelection } from "@/types/menu";
import type { CartItem } from "@/types/order";

// lineId menentukan penggabungan baris keranjang: item + varian + add-on +

// catatan yang identik digabung jumlahnya; catatan berbeda = baris terpisah.
// Lihat docs/10_DATA_MODEL.md §10.2 dan docs/16_TESTING_QA.md (checklist "Item
// identik digabung" / "Item dengan catatan berbeda dianggap baris terpisah").
export function buildLineId(
  itemId: string,
  variantId: string | null,
  addOnIds: readonly string[],
  note: string | undefined,
): string {
  const normalizedNote = note?.trim() ?? "";
  return [
    itemId,
    variantId ?? "-",
    [...addOnIds].sort().join(","),
    normalizedNote,
  ].join("|");
}

// Harga selalu diambil dari data menu (bukan dari pilihan browser) agar tidak
// bisa dimanipulasi. Server tetap menghitung ulang saat pesanan dibuat.
export function toCartItem(
  item: MenuItem,
  selection: ProductSelection,
): CartItem {
  const selectedVariant = selection.variant;
  const variant =
    selectedVariant && item.variants.some((v) => v.id === selectedVariant.id)
      ? selectedVariant
      : null;
  const addOns = item.addOns.filter((addOn) =>
    selection.addOns.some((selected) => selected.id === addOn.id),
  );
  const note = selection.note.trim();

  return {
    lineId: buildLineId(
      item.id,
      variant?.id ?? null,
      addOns.map((addOn) => addOn.id),
      note || undefined,
    ),
    itemId: item.id,
    name: item.name,
    image: item.image,
    variantId: variant?.id ?? null,
    variantName: variant?.name ?? null,
    unitPrice: variant?.price ?? item.basePrice,
    addOns,
    note: note || undefined,
    quantity: selection.quantity,
  };
}
