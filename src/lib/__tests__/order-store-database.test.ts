import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateOrderAccessToken } from "@/lib/order-access";
import type { Order } from "@/types/order";

const mocks = vi.hoisted(() => ({
  getServiceClient: vi.fn(),
  insertOrder: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: mocks.getServiceClient,
}));

vi.mock("@/lib/order-db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/order-db")>()),
  insertOrder: mocks.insertOrder,
}));

import {
  OrderStoreUnavailableError,
  saveOrder,
} from "@/lib/order-store";

function buildOrder(): Order {
  const now = "2026-08-24T05:00:00.000Z";
  return {
    code: "MK-260824-901",
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

describe("saveOrder dengan database terkonfigurasi", () => {
  beforeEach(() => {
    mocks.getServiceClient.mockReturnValue({} as SupabaseClient);
    mocks.insertOrder.mockReset();
  });

  it("mengembalikan pesanan setelah transaksi database berhasil", async () => {
    const order = buildOrder();
    mocks.insertOrder.mockResolvedValue(undefined);

    await expect(saveOrder(order)).resolves.toBe(order);
  });

  it("menolak checkout saat database gagal tanpa membuat pesanan bayangan", async () => {
    mocks.insertOrder.mockRejectedValue(
      new Error("column orders.payment_claimed_at does not exist"),
    );

    await expect(saveOrder(buildOrder())).rejects.toBeInstanceOf(
      OrderStoreUnavailableError,
    );
  });
});
