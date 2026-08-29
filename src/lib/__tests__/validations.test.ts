import { describe, expect, it } from "vitest";

import {
  createOrderSchema,
  patchMenuItemSchema,
  patchOrderSchema,
  phoneSchema,
} from "@/lib/validations";

describe("phoneSchema", () => {
  it.each(["081234567890", "6281234567890", "+6281234567890"])(
    "menerima %s",
    (value) => {
      expect(phoneSchema.safeParse(value).success).toBe(true);
    },
  );

  it.each(["12345", "0712345678", "08", "abcdefghij"])(
    "menolak %s",
    (value) => {
      expect(phoneSchema.safeParse(value).success).toBe(false);
    },
  );

  it("menormalkan 08xx menjadi 62xx", () => {
    expect(phoneSchema.parse("081234567890")).toBe("6281234567890");
  });

  it("menormalkan +628xx menjadi 62xx", () => {
    expect(phoneSchema.parse("+6281234567890")).toBe("6281234567890");
  });
});

const validBaseInput = {
  customer: {
    name: "Rizky",
    whatsapp: "081234567890",
    orderType: "antar" as const,
    address: "Jl. Melati No. 12, RT 03/RW 05",
    addressNote: "Pagar hijau",
    scheduledAt: null,
    note: "Sambelnya pisah ya",
  },
  items: [
    {
      itemId: "taichan-daging",
      variantId: null,
      addOnIds: [],
      quantity: 2,
      note: null,
    },
  ],
  paymentMethod: "qris" as const,
  privacyConsent: true,
};

describe("createOrderSchema", () => {
  it("menerima payload checkout yang lengkap", () => {
    expect(createOrderSchema.safeParse(validBaseInput).success).toBe(true);
  });

  it("menolak nama di bawah 2 karakter", () => {
    const result = createOrderSchema.safeParse({
      ...validBaseInput,
      customer: { ...validBaseInput.customer, name: "R" },
    });

    expect(result.success).toBe(false);
  });

  it("menolak alamat kurang dari 10 karakter saat tipe antar", () => {
    const result = createOrderSchema.safeParse({
      ...validBaseInput,
      customer: { ...validBaseInput.customer, address: "Jl. A" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("address"))).toBe(
        true,
      );
    }
  });

  it("mengizinkan tanpa alamat saat tipe ambil", () => {
    const result = createOrderSchema.safeParse({
      ...validBaseInput,
      customer: {
        name: "Rizky",
        whatsapp: "081234567890",
        orderType: "ambil" as const,
        address: undefined,
        scheduledAt: null,
      },
    });

    expect(result.success).toBe(true);
  });

  it("menolak keranjang kosong", () => {
    const result = createOrderSchema.safeParse({
      ...validBaseInput,
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("mewajibkan persetujuan privasi", () => {
    expect(
      createOrderSchema.safeParse({ ...validBaseInput, privacyConsent: false }).success,
    ).toBe(false);
  });

  it("menolak terlalu banyak baris dan add-on duplikat", () => {
    expect(
      createOrderSchema.safeParse({
        ...validBaseInput,
        items: Array.from({ length: 21 }, () => validBaseInput.items[0]),
      }).success,
    ).toBe(false);
    expect(
      createOrderSchema.safeParse({
        ...validBaseInput,
        items: [{ ...validBaseInput.items[0], addOnIds: ["extra", "extra"] }],
      }).success,
    ).toBe(false);
  });

  it("menolak kuantitas melebihi batas dan metode tak dikenal", () => {
    const result = createOrderSchema.safeParse({
      ...validBaseInput,
      items: [{ ...validBaseInput.items[0]!, quantity: 51 }],
      paymentMethod: "kredit",
    });

    expect(result.success).toBe(false);
  });
});

describe("patchOrderSchema (docs/11 §11.5)", () => {
  it("menerima status, catatan admin, dan ongkir nullable", () => {
    expect(
      patchOrderSchema.safeParse({
        status: "DIKONFIRMASI",
        adminNote: "Bukti transfer valid",
        deliveryFee: 8000,
      }).success,
    ).toBe(true);
    expect(
      patchOrderSchema.safeParse({ deliveryFee: null }).success,
    ).toBe(false);
  });

  it("menolak body kosong dan ongkir tidak valid", () => {
    expect(patchOrderSchema.safeParse({}).success).toBe(false);
    expect(patchOrderSchema.safeParse({ deliveryFee: -1 }).success).toBe(false);
    expect(patchOrderSchema.safeParse({ deliveryFee: 500.5 }).success).toBe(
      false,
    );
  });

  it("menolak status di luar daftar resmi", () => {
    expect(patchOrderSchema.safeParse({ status: "DIANTAR" }).success).toBe(
      false,
    );
  });
});

describe("patchMenuItemSchema", () => {
  it("hanya menerima boolean available", () => {
    expect(patchMenuItemSchema.safeParse({ available: false }).success).toBe(
      true,
    );
    expect(patchMenuItemSchema.safeParse({ available: "habis" }).success).toBe(
      false,
    );
  });
});
