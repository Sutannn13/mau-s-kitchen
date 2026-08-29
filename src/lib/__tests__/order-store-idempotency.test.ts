import { describe, expect, it } from "vitest";

import { generateOrderAccessToken } from "@/lib/order-access";
import {
  IdempotencyKeyReuseError,
  saveOrder,
} from "@/lib/order-store";
import type { Order } from "@/types/order";

function buildOrder(code: string): Order {
  const now = "2026-08-24T05:00:00.000Z";
  return {
    code,
    publicToken: generateOrderAccessToken(),
    createdAt: now,
    customer: {
      name: "Rizky",
      whatsapp: "6281234567890",
      orderType: "ambil",
    },
    items: [
      {
        lineId: "taichan|-|",
        itemId: "taichan",
        name: "Sate Taichan",
        image: "",
        variantId: null,
        variantName: null,
        unitPrice: 25000,
        addOns: [],
        quantity: 1,
      },
    ],
    subtotal: 25000,
    deliveryFee: 0,
    deliveryProvider: null,
    courierCost: null,
    total: 25000,
    paymentMethod: "tunai",
    status: "BARU",
    updatedAt: now,
  };
}

describe("saveOrder idempotency", () => {
  it("mengembalikan pesanan pertama saat request yang sama diulang", async () => {
    const key = crypto.randomUUID();
    const first = buildOrder(`MK-IDEM-${crypto.randomUUID().slice(0, 8)}`);
    const duplicate = buildOrder(`MK-IDEM-${crypto.randomUUID().slice(0, 8)}`);

    await expect(
      saveOrder(first, { key, fingerprint: "a".repeat(64) }),
    ).resolves.toBe(first);
    await expect(
      saveOrder(duplicate, { key, fingerprint: "a".repeat(64) }),
    ).resolves.toBe(first);
  });

  it("menolak key yang dipakai ulang untuk payload berbeda", async () => {
    const key = crypto.randomUUID();
    const first = buildOrder(`MK-IDEM-${crypto.randomUUID().slice(0, 8)}`);
    const changed = buildOrder(`MK-IDEM-${crypto.randomUUID().slice(0, 8)}`);
    await saveOrder(first, { key, fingerprint: "b".repeat(64) });

    await expect(
      saveOrder(changed, { key, fingerprint: "c".repeat(64) }),
    ).rejects.toBeInstanceOf(IdempotencyKeyReuseError);
  });
});
