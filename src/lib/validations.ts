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
        itemId: z.string().trim().min(1).max(80),
        variantId: z.string().trim().min(1).max(80).nullable(),
        addOnIds: z
          .array(z.string().trim().min(1).max(80))
          .max(10, "Tambahan terlalu banyak")
          .refine((ids) => new Set(ids).size === ids.length, {
            message: "Tambahan tidak boleh duplikat",
          })
          .default([]),
        quantity: z.number().int().min(1).max(50),
        note: z.string().max(120).nullable().optional(),
      }),
    )
    .min(1, "Keranjang masih kosong")
    .max(20, "Maksimal 20 baris menu per pesanan")
    .refine(
      (items) => items.reduce((total, item) => total + item.quantity, 0) <= 100,
      "Total kuantitas maksimal 100",
    ),
  paymentMethod: z.enum(["qris", "transfer", "tunai"]),
  privacyConsent: z.boolean().refine((value) => value, {
    message: "Persetujuan privasi wajib diberikan",
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// PATCH /api/orders/[kode] oleh admin (docs/11_API_SPEC.md §11.5).
export const patchOrderSchema = z
  .object({
    status: z.enum(["BARU", "DIKONFIRMASI", "DIPROSES", "DIKIRIM", "SELESAI", "BATAL"]).optional(),
    paymentVerified: z.literal(true).optional(),
    adminNote: z.string().trim().max(500, "Catatan admin maksimal 500 karakter").optional(),
    deliveryFee: z
      .number()
      .int("Ongkir harus bilangan bulat")
      .min(0, "Ongkir tidak boleh negatif")
      .max(1_000_000, "Ongkir tidak wajar")
      .optional(),
    deliveryProvider: z
      .enum(["internal", "gosend", "grabexpress", "other"])
      .optional(),
    courierCost: z
      .number()
      .int("Biaya kurir harus bilangan bulat")
      .min(0, "Biaya kurir tidak boleh negatif")
      .max(1_000_000, "Biaya kurir tidak wajar")
      .optional(),
  })
  .refine(
    (patch) =>
      patch.status !== undefined ||
      patch.adminNote !== undefined ||
      patch.deliveryFee !== undefined ||
      patch.deliveryProvider !== undefined ||
      patch.courierCost !== undefined,
    { message: "Tidak ada perubahan yang dikirim" },
  );

export type PatchOrderInput = z.infer<typeof patchOrderSchema>;

// PATCH /api/menu/[itemId] oleh admin (docs/11_API_SPEC.md §11.1).
// Tetap dipakai oleh toggle ketersediaan legacy; field `available` kini juga
// bisa diatur lewat PATCH /api/admin/menu/items/[id].
export const patchMenuItemSchema = z.object({
  available: z.boolean(),
});

export type PatchMenuItemInput = z.infer<typeof patchMenuItemSchema>;

// ---------------------------------------------------------------------
// Admin CRUD Menu (FR-27). Lihat docs/11_API_SPEC.md §11.8.
// ---------------------------------------------------------------------
const slugPattern = /^[a-z0-9-]+$/;

export const menuVariantInputSchema = z.object({
  id: z.string().regex(slugPattern, "ID varian hanya huruf kecil, angka, strip"),
  name: z.string().trim().min(1).max(40),
  price: z.number().int().min(0),
  sortOrder: z.number().int().default(0),
});

export const createMenuItemSchema = z.object({
  id: z.string().regex(slugPattern, "ID hanya huruf kecil, angka, strip"),
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
  basePrice: z.number().int().min(0),
  unit: z.enum(["porsi", "cup", "item"]),
  isBestSeller: z.boolean().default(false),
  isAddOnItem: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  variants: z.array(menuVariantInputSchema).default([]),
  addOnIds: z.array(z.string().trim().min(1)).default([]),
});

export const updateMenuItemSchema = createMenuItemSchema
  .partial()
  .extend({
    available: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (patch) => Object.keys(patch).length > 0,
    { message: "Tidak ada perubahan yang dikirim" },
  );

export const createCategorySchema = z.object({
  id: z.string().regex(slugPattern, "ID hanya huruf kecil, angka, strip"),
  name: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(120).default(""),
  image: z.string().trim().max(500).default(""),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({
    archived: z.boolean().optional(),
  })
  .refine(
    (patch) => Object.keys(patch).length > 0,
    { message: "Tidak ada perubahan yang dikirim" },
  );

export const createAddOnSchema = z.object({
  id: z.string().regex(slugPattern, "ID hanya huruf kecil, angka, strip"),
  name: z.string().trim().min(1).max(60),
  price: z.number().int().min(0),
});

export const updateAddOnSchema = createAddOnSchema
  .partial()
  .refine(
    (patch) => Object.keys(patch).length > 0,
    { message: "Tidak ada perubahan yang dikirim" },
  );

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateAddOnInput = z.infer<typeof createAddOnSchema>;
export type UpdateAddOnInput = z.infer<typeof updateAddOnSchema>;
export type MenuVariantInput = z.infer<typeof menuVariantInputSchema>;
