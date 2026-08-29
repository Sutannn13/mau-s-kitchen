import {
  getCachedMenu,
  getFreshMenu,
  getItemsByCategoryAsync,
  MenuStoreUnavailableError,
} from "@/lib/menu-data";
import type { CategoryId, MenuItem } from "@/types/menu";

// Setelah migrasi ke tabel menu_items, field `available` disimpan langsung
// di menu_items.available (bukan menu_overrides lagi). Lapisan override ini
// tetap diekspos untuk kompatibilitas pemanggil lama, namun kini mendelegasi
// ke menu-data.ts (DB + fallback JSON).
export { MenuStoreUnavailableError as MenuAvailabilityUnavailableError };

// Deprecated: mengembalikan Map kosong karena `available` kini ada di item
// sendiri (dari DB). Tetap dipertahankan agar pemanggil lama kompilasi.
export async function getAvailabilityOverrides(): Promise<Map<string, boolean>> {
  return new Map();
}

// Deprecated: memaksa baca DB segar (fail-closed) untuk keamanan checkout.
// Mengembalikan Map kosong; lempar error bila DB tidak dapat diakses.
export async function getFreshAvailabilityOverrides(): Promise<Map<string, boolean>> {
  await getFreshMenu();
  return new Map();
}

export function applyOverrides(items: readonly MenuItem[]): MenuItem[] {
  return [...items];
}

export function applyOverrideToItem(item: MenuItem): MenuItem {
  return item;
}

export function isItemAvailable(item: MenuItem): boolean {
  return item.available;
}

export async function getItemsByCategoryWithOverrides(
  categoryId: CategoryId,
): Promise<MenuItem[]> {
  return getItemsByCategoryAsync(categoryId);
}

export async function getAllItemsWithOverrides(): Promise<MenuItem[]> {
  const loaded = await getCachedMenu();
  return loaded.items;
}
