import type { MenuAddOn } from "@/types/menu";

export interface PriceLine {
  unitPrice: number;
  addOns: readonly MenuAddOn[];
  quantity: number;
}

function assertMoney(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Nilai uang harus berupa integer non-negatif.");
  }
}

export function lineSubtotal(item: PriceLine): number {
  assertMoney(item.unitPrice);

  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
    throw new RangeError("Jumlah item minimal satu.");
  }

  const addOnTotal = item.addOns.reduce((total, addOn) => {
    assertMoney(addOn.price);
    return total + addOn.price;
  }, 0);

  // Add-on dihitung per porsi: (harga varian + semua add-on) × jumlah.
  // Lihat docs/05_MENU_CATALOG.md §5.6 dan docs/16_TESTING_QA.md §16.5.
  return (item.unitPrice + addOnTotal) * item.quantity;
}

export function cartSubtotal(items: readonly PriceLine[]): number {
  return items.reduce((total, item) => total + lineSubtotal(item), 0);
}

export function orderTotal(
  subtotal: number,
  deliveryFee: number | null,
): number {
  assertMoney(subtotal);

  if (deliveryFee !== null) {
    assertMoney(deliveryFee);
  }

  return subtotal + (deliveryFee ?? 0);
}
