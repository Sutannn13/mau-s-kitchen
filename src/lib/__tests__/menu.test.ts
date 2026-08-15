import { describe, expect, it } from "vitest";

import {
  getCategoryStartingPrice,
  getItemsByCategory,
  menu,
} from "@/lib/menu";

describe("data menu", () => {
  it("memuat sebelas item aktif dari sumber katalog", () => {
    expect(menu.items).toHaveLength(11);
  });

  it("tidak memasukkan item arsip ke katalog aktif", () => {
    const activeIds = new Set(menu.items.map((item) => item.id));

    for (const archivedItem of menu.archivedItems) {
      expect(activeIds.has(archivedItem.id)).toBe(false);
    }
  });

  it("membatasi add-on hanya untuk kategori ChocoBerry", () => {
    const itemsWithAddOns = menu.items.filter((item) => item.addOns.length > 0);

    expect(itemsWithAddOns.length).toBeGreaterThan(0);
    expect(
      itemsWithAddOns.every((item) => item.categoryId === "chocoberry"),
    ).toBe(true);
  });

  it("mengabaikan item tambahan saat mencari harga mulai Taichan", () => {
    const mainPrices = menu.items
      .filter((item) => item.categoryId === "taichan" && !item.isAddOnItem)
      .map((item) => item.basePrice);

    expect(getCategoryStartingPrice("taichan")).toBe(Math.min(...mainPrices));
  });
});

describe("getItemsByCategory", () => {
  it("mengembalikan empat item Taichan dengan item tambahan di urutan akhir", () => {
    expect(getItemsByCategory("taichan").map((item) => item.id)).toEqual([
      "taichan-daging",
      "taichan-kulit",
      "lontong",
      "sambel-taichan",
    ]);
  });

  it("mengembalikan empat item Minuman", () => {
    expect(getItemsByCategory("minuman")).toHaveLength(4);
  });

  it("mengembalikan tiga item ChocoBerry dengan dua varian dan satu add-on masing-masing", () => {
    const chocoberryItems = getItemsByCategory("chocoberry");

    expect(chocoberryItems).toHaveLength(3);
    for (const item of chocoberryItems) {
      expect(item.variants).toHaveLength(2);
      expect(item.addOns).toHaveLength(1);
    }
  });

  it("tidak mengembalikan item dari kategori lain", () => {
    const categoryIds = getItemsByCategory("taichan").map(
      (item) => item.categoryId,
    );

    expect(categoryIds.every((id) => id === "taichan")).toBe(true);
  });
});
