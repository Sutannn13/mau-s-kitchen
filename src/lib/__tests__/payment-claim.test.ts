import { beforeEach, describe, expect, it } from "vitest";

import { generateOrderAccessToken } from "@/lib/order-access";
import {
  evaluatePaymentClaim,
  markPaymentClaimed,
  saveOrder,
} from "@/lib/order-store";
import type { Order } from "@/types/order";

// Tanpa Supabase env, order-store memakai jalur in-memory (NODE_ENV=test),
// jadi klaim bisa diuji utuh tanpa mock boundary Supabase.

function buildOrder(overrides: Partial<Order> = {}): Order {
  const now = "2026-08-23T05:00:00.000Z";
  return {
    code: "MK-260823-001",
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
    total: 25000,
    paymentMethod: "qris",
    status: "BARU",
    updatedAt: now,
    ...overrides,
    deliveryProvider: overrides.deliveryProvider ?? null,
    courierCost: overrides.courierCost ?? null,
  };
}

describe("evaluatePaymentClaim", () => {
  it("mewajibkan bukti sebelum QRIS dapat diklaim", () => {
    const result = evaluatePaymentClaim(buildOrder());

    expect(result).toMatchObject({ outcome: "not-allowed" });
    expect(result && "message" in result ? result.message : "").toContain(
      "Unggah bukti",
    );
  });

  it("mengizinkan QRIS berbukti dan mempertahankan klaim transfer", () => {
    expect(
      evaluatePaymentClaim(
        buildOrder({ paymentProofUrl: "payment-proofs/qris.webp" }),
      ),
    ).toBeNull();
    expect(
      evaluatePaymentClaim(buildOrder({ paymentMethod: "transfer" })),
    ).toBeNull();
  });

  it("menolak pesanan tunai", () => {
    const result = evaluatePaymentClaim(buildOrder({ paymentMethod: "tunai" }));
    expect(result?.outcome).toBe("not-allowed");
  });

  it("menolak bila status sudah berpindah dari BARU", () => {
    const result = evaluatePaymentClaim(
      buildOrder({ status: "DIKONFIRMASI" }),
    );
    expect(result?.outcome).toBe("not-allowed");
  });

  it("menolak delivery sebelum admin menetapkan rencana pengantaran", () => {
    const result = evaluatePaymentClaim(
      buildOrder({
        customer: {
          name: "Rizky",
          whatsapp: "6281234567890",
          orderType: "antar",
          address: "Alamat pengujian",
        },
        deliveryFee: null,
      }),
    );

    expect(result).toMatchObject({ outcome: "not-allowed" });
  });

  it("mengizinkan delivery non-tunai setelah rencana kurir lengkap", () => {
    const result = evaluatePaymentClaim(
      buildOrder({
        customer: {
          name: "Rizky",
          whatsapp: "6281234567890",
          orderType: "antar",
          address: "Alamat pengujian lengkap",
        },
        deliveryFee: 12_000,
        deliveryProvider: "gosend",
        courierCost: 15_000,
        total: 37_000,
        paymentProofUrl: "payment-proofs/delivery-qris.webp",
      }),
    );

    expect(result).toBeNull();
  });

  it("mengembalikan already-claimed bila klaim sudah tercatat", () => {
    const claimedAt = "2026-08-23T06:00:00.000Z";
    const result = evaluatePaymentClaim(
      buildOrder({
        paymentClaimedAt: claimedAt,
        paymentProofUrl: "payment-proofs/qris.webp",
      }),
    );
    expect(result).toEqual({ outcome: "already-claimed", claimedAt });
  });
});

describe("markPaymentClaimed", () => {
  let order: Order;

  beforeEach(async () => {
    order = buildOrder({
      code: `MK-260823-${Math.random().toString().slice(2, 5)}`,
      paymentProofUrl: "payment-proofs/qris.webp",
    });
    await saveOrder(order);
  });

  it("mencatat klaim pada pesanan yang valid", async () => {
    const result = await markPaymentClaimed(order.code, order.publicToken);
    expect(result.outcome).toBe("claimed");
    if (result.outcome === "claimed") {
      expect(Number.isNaN(Date.parse(result.claimedAt))).toBe(false);
    }
  });

  it("idempoten: klaim kedua mengembalikan already-claimed", async () => {
    await markPaymentClaimed(order.code, order.publicToken);
    const second = await markPaymentClaimed(order.code, order.publicToken);
    expect(second.outcome).toBe("already-claimed");
  });

  it("menolak token yang tidak cocok", async () => {
    const result = await markPaymentClaimed(
      order.code,
      generateOrderAccessToken(),
    );
    expect(result.outcome).toBe("not-found");
  });

  it("mengembalikan not-found untuk kode yang tidak ada", async () => {
    const result = await markPaymentClaimed(
      "MK-260823-999",
      order.publicToken,
    );
    expect(result.outcome).toBe("not-found");
  });

  it("menolak klaim pesanan tunai", async () => {
    const cash = buildOrder({
      code: "MK-260823-777",
      paymentMethod: "tunai",
      publicToken: generateOrderAccessToken(),
    });
    await saveOrder(cash);
    const result = await markPaymentClaimed(cash.code, cash.publicToken);
    expect(result.outcome).toBe("not-allowed");
  });
});
