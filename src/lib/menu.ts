import menuJson from "../../data/menu.json";

import type { CategoryId, MenuCategory, MenuData, MenuItem } from "@/types/menu";

// data/menu.json adalah sumber kebenaran katalog yang ditinjau pemilik.
// Lihat docs/05_MENU_CATALOG.md §5.6 dan docs/10_DATA_MODEL.md §10.1.
export const menu = menuJson as MenuData;

export function getMenuItemById(id: string): MenuItem | undefined {
  return menu.items.find((item) => item.id === id);
}

export function getCategoryById(id: CategoryId): MenuCategory | undefined {
  return menu.categories.find((category) => category.id === id);
}

// Penjaga tipe untuk param rute /menu/[kategori] yang datang sebagai string.
export function isCategoryId(value: string): value is CategoryId {
  return menu.categories.some((category) => category.id === value);
}

// Item utama mengikuti urutan JSON; item tambahan (Lontong, Sambel Taichan)
// selalu ditempatkan di akhir section. Lihat docs/08_UI_UX_SPEC.md §8.3.
export function getItemsByCategory(categoryId: CategoryId): MenuItem[] {
  const mainItems = menu.items.filter(
    (item) => item.categoryId === categoryId && !item.isAddOnItem,
  );
  const addOnItems = menu.items.filter(
    (item) => item.categoryId === categoryId && item.isAddOnItem === true,
  );

  return [...mainItems, ...addOnItems];
}

export function getCategoryStartingPrice(categoryId: CategoryId): number {
  // Harga mulai kategori Taichan tidak memasukkan Lontong/Sambel yang berstatus
  // item tambahan. Lihat docs/08_UI_UX_SPEC.md §8.2.
  const prices = menu.items
    .filter((item) => item.categoryId === categoryId && !item.isAddOnItem)
    .map((item) => item.basePrice);

  if (prices.length === 0) {
    throw new Error("Kategori menu tidak memiliki produk utama.");
  }

  return Math.min(...prices);
}
