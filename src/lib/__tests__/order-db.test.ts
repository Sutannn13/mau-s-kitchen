import { describe, expect, it } from "vitest";

import { getJakartaDayStartUtc, rowToOrder } from "@/lib/order-db";

describe("getJakartaDayStartUtc", () => {
  it("mengembalikan tengah malam WIB untuk siang hari Jakarta", () => {
    // 16 Agustus 2026 10:00 WIB = 03:00 UTC
    const start = getJakartaDayStartUtc(new Date("2026-08-16T03:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-15T17:00:00.000Z");
  });

  it("bergeser ke hari berikutnya setelah jam 17:00 UTC", () => {
    // 16 Agustus 2026 00:30 WIB = 15 Agustus 17:30 UTC → hari Jakarta = 16
    const start = getJakartaDayStartUtc(new Date("2026-08-15T17:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-15T17:00:00.000Z");
  });
});

describe("rowToOrder", () => {
  const row = {
    code: "MK-260816-001",
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
    total: 118000,
    payment_method: "qris" as const,
    payment_proof_url: null,
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
    expect(order.customer.name).toBe("Rizky");
    expect(order.customer.address).toBe("Jl. Melati No. 12");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.addOns[0]?.price).toBe(8000);
    expect(order.status).toBe("BARU");
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
});
