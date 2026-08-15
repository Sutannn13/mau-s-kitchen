import { describe, expect, it } from "vitest";

import { buildLineId, toCartItem } from "@/lib/cart-line";
import { getMenuItemById } from "@/lib/menu";

const grape = getMenuItemById("choco-berry-grape");
const taichanDaging = getMenuItemById("taichan-daging");

describe("buildLineId", () => {
  it("menghasilkan lineId sama untuk add-on dengan urutan berbeda", () => {
    expect(
      buildLineId("a", null, ["x", "y"], undefined),
    ).toBe(buildLineId("a", null, ["y", "x"], undefined));
  });

  it("membedakan varian, item, dan catatan", () => {
    const base = buildLineId("a", "small", ["x"], "pedes");
    expect(buildLineId("a", "medium", ["x"], "pedes")).not.toBe(base);
    expect(buildLineId("b", "small", ["x"], "pedes")).not.toBe(base);
    expect(buildLineId("a", "small", ["x"], "tidak pedes")).not.toBe(base);
  });

  it("menganggap catatan kosong sama dengan tanpa catatan", () => {
    expect(buildLineId("a", null, [], "  ")).toBe(
      buildLineId("a", null, [], undefined),
    );
  });
});

describe("toCartItem", () => {
  it("memakai harga varian dan menyaring add-on dari data menu", () => {
    if (!grape) throw new Error("fixture menu hilang");
    const cartItem = toCartItem(grape, {
      variant: grape.variants[1] ?? null,
      addOns: grape.addOns,
      quantity: 2,
      note: "coklatnya banyak",
    });

    expect(cartItem.variantId).toBe("medium");
    expect(cartItem.variantName).toBe("Medium");
    expect(cartItem.unitPrice).toBe(40000);
    expect(cartItem.addOns).toEqual(grape.addOns);
    expect(cartItem.note).toBe("coklatnya banyak");
    expect(cartItem.quantity).toBe(2);
  });

  it("memakai basePrice untuk item tanpa varian dan note kosong jadi undefined", () => {
    if (!taichanDaging) throw new Error("fixture menu hilang");
    const cartItem = toCartItem(taichanDaging, {
      variant: null,
      addOns: [],
      quantity: 1,
      note: "   ",
    });

    expect(cartItem.variantId).toBeNull();
    expect(cartItem.unitPrice).toBe(35000);
    expect(cartItem.note).toBeUndefined();
  });
});
