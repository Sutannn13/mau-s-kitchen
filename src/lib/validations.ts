import { z } from "zod";

// Skema dipakai ulang di form checkout (klien) dan route handler (server).
// Lihat docs/11_API_SPEC.md §11.2 dan docs/16_TESTING_QA.md §16.2.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?62|0)8[1-9][0-9]{6,11}$/, "Nomor WhatsApp tidak valid")
  .transform((value) =>
    value.replace(/^\+?62/, "62").replace(/^0/, "62"),
  );

export const createOrderSchema = z.object({
  customer: z
    .object({
      name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60),
      whatsapp: phoneSchema,
      orderType: z.enum(["antar", "ambil"]),
      address: z.string().trim().max(300).optional(),
      addressNote: z.string().trim().max(150).optional(),
      scheduledAt: z.string().datetime().nullable().optional(),
      note: z.string().trim().max(200).optional(),
    })
    .refine((customer) => customer.orderType !== "antar" || (customer.address?.length ?? 0) >= 10, {
      message: "Alamat wajib diisi untuk pesanan antar",
      path: ["address"],
    }),
  items: z
    .array(
      z.object({
        itemId: z.string(),
        variantId: z.string().nullable(),
        addOnIds: z.array(z.string()).default([]),
        quantity: z.number().int().min(1).max(50),
        note: z.string().max(120).nullable().optional(),
      }),
    )
    .min(1, "Keranjang masih kosong"),
  paymentMethod: z.enum(["qris", "transfer", "tunai"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// PATCH /api/orders/[kode] oleh admin (docs/11_API_SPEC.md §11.5).
export const patchOrderSchema = z
  .object({
    status: z.enum(["BARU", "DIKONFIRMASI", "DIPROSES", "DIKIRIM", "SELESAI", "BATAL"]).optional(),
    adminNote: z.string().trim().max(500, "Catatan admin maksimal 500 karakter").optional(),
    deliveryFee: z
      .number()
      .int("Ongkir harus bilangan bulat")
      .min(0, "Ongkir tidak boleh negatif")
      .max(1_000_000, "Ongkir tidak wajar")
      .nullable()
      .optional(),
  })
  .refine(
    (patch) => patch.status !== undefined || patch.adminNote !== undefined || patch.deliveryFee !== undefined,
    { message: "Tidak ada perubahan yang dikirim" },
  );

export type PatchOrderInput = z.infer<typeof patchOrderSchema>;

// PATCH /api/menu/[itemId] oleh admin (docs/11_API_SPEC.md §11.1).
export const patchMenuItemSchema = z.object({
  available: z.boolean(),
});

export type PatchMenuItemInput = z.infer<typeof patchMenuItemSchema>;
