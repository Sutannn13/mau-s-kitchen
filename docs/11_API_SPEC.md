# 11 — API Specification

Semua endpoint berada di Next.js Route Handlers (`src/app/api/**/route.ts`).
Format pertukaran data: JSON. Semua nilai uang berupa integer rupiah.

---

## 11.1 Ringkasan endpoint

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| `POST` | `/api/orders` | – | Membuat pesanan baru |
| `GET` | `/api/orders` | ✅ admin | Daftar pesanan (filter + paginasi) |
| `GET` | `/api/orders/[kode]` | – | Detail pesanan berdasarkan kode |
| `PATCH` | `/api/orders/[kode]` | ✅ admin | Ubah status / catatan admin |
| `POST` | `/api/orders/[kode]/proof` | – | Unggah bukti pembayaran |
| `GET` | `/api/menu` | – | Menu + status ketersediaan terkini |
| `PATCH` | `/api/menu/[itemId]` | ✅ admin | Ubah ketersediaan / harga |
| `GET` | `/api/rekap?tanggal=` | ✅ admin | Rekap penjualan harian |

---

## 11.2 `POST /api/orders`

Membuat pesanan baru.

### Request

```json
{
  "customer": {
    "name": "Rizky",
    "whatsapp": "081234567890",
    "orderType": "antar",
    "address": "Jl. Melati No. 12, RT 03/RW 05",
    "addressNote": "Pagar hijau, sebelah warung",
    "scheduledAt": null,
    "note": "Sambelnya pisah ya"
  },
  "items": [
    {
      "itemId": "taichan-daging",
      "variantId": null,
      "addOnIds": [],
      "quantity": 2,
      "note": null
    },
    {
      "itemId": "choco-berry-grape",
      "variantId": "medium",
      "addOnIds": ["pistacio-kunava"],
      "quantity": 1,
      "note": null
    }
  ],
  "paymentMethod": "qris"
}
```

> 🔐 **Penting:** klien **tidak** mengirim harga. Server menghitung ulang seluruh harga
> dari `data/menu.json` untuk mencegah manipulasi harga dari sisi browser.

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "code": "MK-260814-001",
    "createdAt": "2026-08-14T12:45:00.000Z",
    "subtotal": 118000,
    "deliveryFee": null,
    "total": 118000,
    "paymentMethod": "qris",
    "status": "BARU",
    "whatsappUrl": "https://wa.me/6281617691585?text=...",
    "paymentUrl": "/pembayaran/MK-260814-001"
  }
}
```

### Response error

| Kode | Kondisi | Body |
|---|---|---|
| `400` | Validasi gagal | `{ "success": false, "error": "VALIDATION_ERROR", "fields": { "whatsapp": "Nomor WhatsApp tidak valid" } }` |
| `409` | Ada item yang habis | `{ "success": false, "error": "ITEM_UNAVAILABLE", "items": ["thai-tea"] }` |
| `422` | Keranjang kosong | `{ "success": false, "error": "EMPTY_CART" }` |
| `429` | Terlalu banyak permintaan | `{ "success": false, "error": "RATE_LIMITED" }` |
| `500` | Kesalahan server | `{ "success": false, "error": "INTERNAL_ERROR" }` |

### Validasi server (Zod)

```ts
// lib/validations.ts
import { z } from "zod"

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?62|0)8[1-9][0-9]{6,11}$/, "Nomor WhatsApp tidak valid")
  .transform((v) => v.replace(/^\+?62/, "62").replace(/^0/, "62"))

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
    .refine((c) => c.orderType !== "antar" || (c.address?.length ?? 0) >= 10, {
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
})
```

---

## 11.3 `GET /api/orders` (admin)

### Query parameter

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `status` | string | semua | `BARU`, `DIPROSES`, dst. |
| `tanggal` | `YYYY-MM-DD` | hari ini | Zona Asia/Jakarta |
| `page` | number | 1 | Halaman |
| `limit` | number | 20 | Maks 100 |

### Response `200`

```json
{
  "success": true,
  "data": {
    "orders": [ { "code": "MK-260814-001", "...": "..." } ],
    "pagination": { "page": 1, "limit": 20, "total": 34, "totalPages": 2 }
  }
}
```

---

## 11.4 `GET /api/orders/[kode]`

Mengembalikan detail pesanan untuk halaman pelacakan pelanggan.

- Tanpa auth, tetapi **data sensitif disamarkan**: alamat lengkap dan nomor WhatsApp
  ditampilkan sebagian (`0812****7890`).
- `404` jika kode tidak ditemukan.

---

## 11.5 `PATCH /api/orders/[kode]` (admin)

```json
{ "status": "DIKONFIRMASI", "adminNote": "Bukti transfer valid", "deliveryFee": 8000 }
```

Aturan:
- Transisi status wajib mengikuti state machine di `04_BUSINESS_FLOW.md`.
- Transisi tidak sah → `400 INVALID_STATUS_TRANSITION`.
- Jika `deliveryFee` diisi, `total` dihitung ulang oleh server.

---

## 11.6 `POST /api/orders/[kode]/proof`

- `multipart/form-data`, field `file`.
- Hanya `image/jpeg`, `image/png`, `image/webp`. Maksimal 5MB.
- Disimpan di Supabase Storage bucket `payment-proofs`, nama file `{kode}-{timestamp}.{ext}`.
- Response: `{ "success": true, "data": { "url": "https://..." } }`.

---

## 11.7 `GET /api/menu`

Menggabungkan `data/menu.json` dengan tabel `menu_overrides`.

```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "categories": [ "..." ],
    "items": [
      { "id": "taichan-daging", "available": true, "basePrice": 35000, "...": "..." }
    ]
  }
}
```

Header cache: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

---

## 11.8 `GET /api/rekap?tanggal=YYYY-MM-DD` (admin)

```json
{
  "success": true,
  "data": {
    "tanggal": "2026-08-14",
    "totalPesanan": 23,
    "pesananSelesai": 20,
    "pesananBatal": 1,
    "omzet": 1450000,
    "rataRataTransaksi": 63043,
    "itemTerlaris": [
      { "itemId": "taichan-daging", "name": "Taichan Daging", "qty": 31 },
      { "itemId": "thai-tea", "name": "Thai Tea", "qty": 24 }
    ],
    "perMetodeBayar": { "qris": 15, "transfer": 3, "tunai": 5 }
  }
}
```

> Omzet hanya menghitung pesanan berstatus `SELESAI`.

---

## 11.9 Konvensi umum

1. Format sukses: `{ "success": true, "data": {...} }`
2. Format gagal: `{ "success": false, "error": "KODE_ERROR", "message": "pesan ramah" }`
3. Kode error menggunakan `SCREAMING_SNAKE_CASE`.
4. `message` selalu Bahasa Indonesia (langsung bisa ditampilkan ke pengguna).
5. Semua endpoint tulis wajib memvalidasi ulang input di server.
6. Rate limit `POST /api/orders`: maksimal 5 permintaan per IP per menit.
7. Jangan pernah mengembalikan `SUPABASE_SERVICE_ROLE_KEY` atau data internal lain.

---

➡️ Lanjut ke `12_PAYMENT_QRIS.md`
