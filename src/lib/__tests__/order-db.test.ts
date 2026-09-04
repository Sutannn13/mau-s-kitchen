import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  findOrderRowsByPublicAccess,
  getJakartaDayStartUtc,
  insertOrder,
  OrderDatabaseError,
  OrderIdempotencyConflictError,
  rowToOrder,
} from "@/lib/order-db";

describe("getJakartaDayStartUtc", () => {
  it("mengembalikan tengah malam WIB untuk siang hari Jakarta", () => {
    const start = getJakartaDayStartUtc(new Date("2026-08-16T03:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-15T17:00:00.000Z");
  });

  it("bergeser ke hari berikutnya setelah jam 17:00 UTC", () => {
    const start = getJakartaDayStartUtc(new Date("2026-08-15T17:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-15T17:00:00.000Z");
  });
});

describe("rowToOrder", () => {
  const row = {
    code: "MK-260816-001",
    public_token: "a".repeat(43),
    created_at: "2026-08-16T03:00:00.000Z",
    updated_at: "2026-08-16T03:05:00.000Z",
    customer_name: "Rizky",
    customer_wa: "6281234567890",
    order_type: "antar" as const,
    address: "Jl. Melati No. 12",
    address_note: "Pagar hijau",
    scheduled_at: null,
    customer_note: "Sambelnya pisah",
    subtotal: 118000,
    delivery_fee: null,
    delivery_provider: null,
    courier_cost: null,
    total: 118000,
    payment_method: "qris" as const,
    payment_proof_url: null,
    payment_claimed_at: "2026-08-16T03:04:00.000Z",
    payment_reference: "QRIS-1234",
    payment_verified_at: "2026-08-16T03:05:00.000Z",
    status: "BARU" as const,
    admin_note: null,
  };

  const itemRows = [
    {
      item_id: "choco-berry-grape",
      item_name: "Choco Berry Grape",
      variant_id: "medium",
      variant_name: "Medium",
      unit_price: 40000,
      add_ons: [{ id: "pistacio-kunava", name: "Pistacio Kunava", price: 8000 }],
      note: null,
      quantity: 1,
      subtotal: 48000,
    },
  ];

  it("memetakan baris DB ke Order lengkap", () => {
    const order = rowToOrder(row, itemRows);
    expect(order.code).toBe("MK-260816-001");
    expect(order.publicToken).toBe("a".repeat(43));
    expect(order.customer.name).toBe("Rizky");
    expect(order.customer.address).toBe("Jl. Melati No. 12");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.addOns[0]?.price).toBe(8000);
    expect(order.status).toBe("BARU");
    expect(order.deliveryProvider).toBeNull();
    expect(order.courierCost).toBeNull();
    expect(order.paymentReference).toBe("QRIS-1234");
    expect(order.paymentVerifiedAt).toBe("2026-08-16T03:05:00.000Z");
  });

  it("mengisi image item dari katalog menu.json", () => {
    const order = rowToOrder(row, itemRows);
    expect(order.items[0]?.image).toContain("/assets/menu/");
  });

  it("add_ons yang rusak diabaikan dengan aman", () => {
    const order = rowToOrder(row, [
      { ...itemRows[0]!, add_ons: null as unknown as never },
    ]);
    expect(order.items[0]?.addOns).toEqual([]);
  });

  it("menyimpan header dan item lewat satu RPC transaksi", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "MK-260816-002",
      error: null,
    });
    const supabase = { rpc } as unknown as SupabaseClient;
    const order = rowToOrder(row, itemRows);

    await expect(
      insertOrder(supabase, order, {
        key: "e55f3308-9cb8-42e5-a36f-a53264755152",
        fingerprint: "a".repeat(64),
      }),
    ).resolves.toBe("MK-260816-002");

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "insert_order_with_items_v2",
      expect.objectContaining({
        p_order: expect.objectContaining({
          code: row.code,
          idempotency_key: "e55f3308-9cb8-42e5-a36f-a53264755152",
        }),
        p_items: expect.arrayContaining([
          expect.objectContaining({ item_id: "choco-berry-grape" }),
        ]),
      }),
    );
  });

  it("mengenali konflik unique idempotency dari RPC", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "23505",
          message: 'duplicate key violates "orders_idempotency_key_idx"',
        },
      }),
    } as unknown as SupabaseClient;

    await expect(
      insertOrder(supabase, rowToOrder(row, itemRows), {
        key: "e55f3308-9cb8-42e5-a36f-a53264755152",
        fingerprint: "a".repeat(64),
      }),
    ).rejects.toBeInstanceOf(OrderIdempotencyConflictError);
  });

  it("menolak RPC lama yang belum mengembalikan kode atomik", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: "b3f19f92-af4c-4f67-a7e2-d52a9b1a94eb",
        error: null,
      }),
    } as unknown as SupabaseClient;

    await expect(insertOrder(supabase, rowToOrder(row, itemRows))).rejects.toBeInstanceOf(
      OrderDatabaseError,
    );
  });
});

describe("findOrderRowsByPublicAccess", () => {
  function orderQuery(result: { data: unknown; error: unknown }): SupabaseClient {
    const builder = {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      async maybeSingle() {
        return result;
      },
    };
    return {
      from: () => builder,
    } as unknown as SupabaseClient;
  }

  it("mengembalikan null hanya ketika query sukses dan pesanan tidak ada", async () => {
    await expect(
      findOrderRowsByPublicAccess(
        orderQuery({ data: null, error: null }),
        "MK-NOT-FOUND",
        "a".repeat(43),
      ),
    ).resolves.toBeNull();
  });

  it("membedakan kegagalan database dari pesanan tidak ditemukan", async () => {
    await expect(
      findOrderRowsByPublicAccess(
        orderQuery({ data: null, error: { message: "database unavailable" } }),
        "MK-ERROR",
        "a".repeat(43),
      ),
    ).rejects.toBeInstanceOf(OrderDatabaseError);
  });
});
