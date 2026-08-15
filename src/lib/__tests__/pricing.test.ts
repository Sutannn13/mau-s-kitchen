import { describe, expect, it } from "vitest";

import { getMenuItemById } from "@/lib/menu";
import { cartSubtotal, lineSubtotal, orderTotal } from "@/lib/pricing";

function getRequiredItem(id: string) {
  const item = getMenuItemById(id);

  if (!item) {
    throw new Error("Data menu pengujian tidak ditemukan.");
  }

  return item;
}

describe("lineSubtotal", () => {
  it("menghitung item tanpa varian dan tanpa add-on", () => {
    const taichan = getRequiredItem("taichan-daging");

    expect(
      lineSubtotal({
        unitPrice: taichan.basePrice,
        addOns: taichan.addOns,
        quantity: 2,
      }),
    ).toBe(taichan.basePrice * 2);
  });

  it("menambahkan add-on per porsi", () => {
    const grape = getRequiredItem("choco-berry-grape");
    const medium = grape.variants.find((variant) => variant.id === "medium");

    expect(medium).toBeDefined();
    expect(
      lineSubtotal({
        unitPrice: medium?.price ?? 0,
        addOns: grape.addOns,
        quantity: 2,
      }),
    ).toBe(
      (medium?.price ?? 0) * 2 +
        grape.addOns.reduce((total, addOn) => total + addOn.price * 2, 0),
    );
  });

  it("menolak jumlah item yang tidak valid", () => {
    const item = getRequiredItem("aren-latte");

    expect(() =>
      lineSubtotal({
        unitPrice: item.basePrice,
        addOns: item.addOns,
        quantity: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe("total pesanan", () => {
  it("menjumlahkan semua baris dan ongkir", () => {
    const taichan = getRequiredItem("taichan-kulit");
    const drink = getRequiredItem("thai-tea");
    const items = [
      {
        unitPrice: taichan.basePrice,
        addOns: taichan.addOns,
        quantity: 2,
      },
      {
        unitPrice: drink.basePrice,
        addOns: drink.addOns,
        quantity: 2,
      },
    ];
    const subtotal = cartSubtotal(items);
    // Nilai sintetis satu rupiah hanya menguji operasi penjumlahan, bukan
    // menetapkan tarif ongkir bisnis yang masih TBD.
    const syntheticDeliveryFee = 1;

    expect(orderTotal(subtotal, syntheticDeliveryFee)).toBe(
      subtotal + syntheticDeliveryFee,
    );
    expect(orderTotal(subtotal, null)).toBe(subtotal);
  });
});
