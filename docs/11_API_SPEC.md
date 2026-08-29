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
| `POST` | `/api/orders/[kode]/claim` | – | Pelanggan menandai "sudah bayar" |
| `GET` | `/api/menu` | – | Menu + status ketersediaan terkini |
| `PATCH` | `/api/menu/[itemId]` | ✅ admin | Ubah ketersediaan item (legacy toggle) |
| `GET` | `/api/admin/menu` | ✅ admin | Daftar kategori + item + varian + add-on (termasuk arsip) |
| `POST` | `/api/admin/menu/categories` | ✅ admin | Buat kategori baru |
| `PATCH` | `/api/admin/menu/categories/[id]` | ✅ admin | Ubah/arsip/restore kategori |
| `POST` | `/api/admin/menu/items` | ✅ admin | Buat item baru (+ varian + tautan add-on) |
| `PATCH` | `/api/admin/menu/items/[id]` | ✅ admin | Ubah item (nama, harga, varian, add-on, urutan, best seller, arsip) |
| `POST` | `/api/admin/menu/items/[id]/image` | ✅ admin | Unggah foto menu (multipart → WebP) |
| `DELETE` | `/api/admin/menu/items/[id]` | ✅ admin | Arsip item (soft delete: `archived=true`) |
| `GET` | `/api/admin/menu/addons` | ✅ admin | Daftar add-on global |
| `POST` | `/api/admin/menu/addons` | ✅ admin | Buat add-on global |
| `PATCH` | `/api/admin/menu/addons/[id]` | ✅ admin | Ubah/hapus add-on |
| `GET` | `/api/rekap?tanggal=` | ✅ admin | Rekap penjualan harian |

---

## 11.2 `POST /api/orders`

Membuat pesanan baru.

Header wajib: `Idempotency-Key: <UUID v4>`. Browser menyimpan key per payload di
`sessionStorage` sampai respons sukses. Retry dengan key + payload identik
mengembalikan pesanan yang sama; key identik untuk payload berbeda ditolak.

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
> dari `data/menu.json` / tabel `menu_items` untuk mencegah manipulasi harga
> dari sisi browser. Bila DB tidak dapat diakses saat checkout, server menolak
> dengan `503 MENU_STORE_UNAVAILABLE` (tidak pakai fallback JSON yang mungkin stale).

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "code": "MK-260814-001",
    "token": "<token-acak-rahasia>",
    "trackingUrl": "/pesanan/MK-260814-001?token=<token>",
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
| `400` | Validasi gagal / key retry tidak sah | `VALIDATION_ERROR` atau `INVALID_IDEMPOTENCY_KEY` |
| `409` | Ada item yang habis | `{ "success": false, "error": "ITEM_UNAVAILABLE", "items": ["thai-tea"] }` |
| `409` | Key retry dipakai untuk payload berbeda | `{ "success": false, "error": "IDEMPOTENCY_CONFLICT" }` |
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

- Wajib query `token` acak milik pesanan: `/api/orders/[kode]?token=...`.
- `kode` wajib berformat `MK-YYMMDD-XXX`; path pendek seperti `/1` atau
  `/2` ditolak `404` sebelum rate limiter dan query database.
- Rate limit aplikasi: 120 lookup/menit per IP Cloudflare. Lewat batas →
  `429 RATE_LIMITED`; rate limit edge Cloudflare tetap wajib untuk produksi.
- Response publik tidak memuat nama, WhatsApp, alamat, catatan pelanggan,
  catatan item, catatan admin, path bukti pembayaran, atau token itu sendiri.
- Menyertakan `paymentProofSubmitted` dan `paymentClaimed` sebagai boolean
  (tanpa path berkas maupun timestamp).
- Menyertakan `deliveryProvider` untuk transparansi pengantaran, tetapi tidak
  pernah mengekspos `courierCost` atau margin/subsidi internal.
- `404` jika kode tidak ditemukan.

---

## 11.5 `PATCH /api/orders/[kode]` (admin)

```json
{
  "status": "DIKONFIRMASI",
  "adminNote": "Bukti transfer valid",
  "deliveryFee": 12000,
  "deliveryProvider": "gosend",
  "courierCost": 15000
}
```

Aturan:
- Transisi status wajib mengikuti state machine di `04_BUSINESS_FLOW.md`.
- Transisi tidak sah → `400 INVALID_STATUS_TRANSITION`.
- `deliveryFee`, `deliveryProvider`, dan `courierCost` wajib dikirim bersama
  untuk pesanan Antar berstatus `BARU`, sebelum klaim/bukti pembayaran.
- `deliveryProvider`: `internal | gosend | grabexpress | other`. Nilai biaya
  wajib integer `0..1.000.000`; provider internal memaksa biaya kurir Rp0.
- Pesanan Ambil selalu ongkir Rp0 (`409 PICKUP_FEE_FIXED` bila dicoba diubah).
- Setelah pembayaran diklaim/bukti dikirim atau status dikonfirmasi, perubahan
  rencana pengantaran ditolak dengan `409 ORDER_FINANCIALS_LOCKED`.
- Delivery tanpa rencana lengkap tidak dapat dikonfirmasi
  (`409 DELIVERY_PLAN_PENDING`).
- Delivery Tunai/COD dengan provider eksternal ditolak
  (`409 COD_REQUIRES_INTERNAL_DELIVERY`).
- Jika rencana diisi, `total` dihitung ulang oleh server.
- Write memakai compare-and-swap terhadap `updated_at` (dan status lama bila
  status diubah). Jika tab/admin lain sudah lebih dulu mengubah pesanan →
  `409 ORDER_CONFLICT`; UI harus memuat ulang sebelum retry.

---

## 11.6 `POST /api/orders/[kode]/proof`

- `multipart/form-data`, field `file`.
- Wajib query `token` acak yang cocok dengan pesanan.
- UI menerima sumber JPG, PNG, atau WebP maksimal 4MB, mendecode-nya dengan
  Canvas browser, membatasi sisi terpanjang maksimal 1.920px, lalu menargetkan
  hasil WebP 700KB. Metadata file asli tidak ikut tersimpan.
- Endpoint tidak mempercayai hasil client: ukuran hasil maksimal 1MiB serta
  signature, struktur container, dan dimensi JPEG/PNG/WebP divalidasi ulang.
  File palsu, container terpotong, dan gambar berdimensi ekstrem ditolak.
- Hanya pesanan non-tunai berstatus `BARU` yang total dan rencana pengantarannya sudah final dan belum
  mempunyai bukti. Rencana pengantaran parsial ditolak dengan
  `409 DELIVERY_PLAN_PENDING`.
- Disimpan dengan nama UUID acak pada bucket privat `payment-proofs`.
- Response tidak mengembalikan signed URL: `{ "success": true, "data": { "submitted": true } }`.

---

## 11.6b `POST /api/orders/[kode]/claim`

Pelanggan menandai pesanannya sudah dibayar dari halaman `/pembayaran/[kode]`
(tombol "Saya Sudah Bayar & Kirim Bukti").

- Wajib query `token` acak milik pesanan; tanpa login pelanggan.
- Hanya pesanan **non-tunai** berstatus **`BARU`** dengan total dan rencana pengantaran final. Delivery
  tanpa rencana lengkap ditolak sebagai `not-allowed`.
- **Tidak mengubah status pesanan.** Hanya mengisi `payment_claimed_at`;
  verifikasi & transisi ke `DIKONFIRMASI` tetap wewenang admin (§4.3).
- Idempoten: klaim berulang tetap `200`.
- Rate limit: 10 permintaan / 10 menit per IP.

### Response `200`

```json
{
  "success": true,
  "data": { "paymentClaimed": true, "paymentClaimedAt": "2026-08-23T12:30:00.000Z" }
}
```

### Error

| Status | `error` | Kapan |
|---|---|---|
| `404` | `NOT_FOUND` | Kode/token tidak cocok |
| `409` | `CLAIM_NOT_ALLOWED` | Pesanan tunai atau status bukan `BARU` |
| `429` | `RATE_LIMITED` | Melebihi rate limit |
| `503` | `ORDER_STORE_UNAVAILABLE` | Penyimpanan pesanan belum aktif |

---

## 11.7 `GET /api/menu`

Membaca katalog dari tabel `menu_items` + relasi (sumber kebenaran utama),
dengan fallback ke `data/menu.json` bila Supabase tidak tersedia. Field
`available` kini disimpan langsung di `menu_items` (tidak lagi `menu_overrides`).

```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "updatedAt": "2026-08-14",
    "currency": "IDR",
    "brand": { "..." : "..." },
    "categories": [ "..." ],
    "items": [
      { "id": "taichan-daging", "available": true, "basePrice": 35000, "...": "..." }
    ]
  }
}
```

Header cache: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

---

## 11.8 Admin CRUD Menu (`/api/admin/menu/*`)

Endpoint CRUD kategori + item + varian + add-on + foto (FR-27). Semua wajib
`verifyAdminRequest(request)` → `getServiceClient()` (service role, bypass RLS);
menolak dengan `401 UNAUTHORIZED` bila bukan admin dan `503 FITUR_BELUM_AKTIF`
bila DB belum dikonfigurasi. Setelah mutasi sukses, `revalidatePath("/", "layout")`
dipanggil agar ISR cache di-bust lebih cepat dari jendela 60 detik.

### `GET /api/admin/menu`
Daftar kategori + item + varian + add-on global (termasuk arsip) untuk dashboard.

### `POST /api/admin/menu/categories`
```json
{ "id": "snack", "name": "Snack", "tagline": "...", "image": "", "sortOrder": 4 }
```
- Salah: `409 DUPLICATE_SLUG` (id sudah dipakai).

### `PATCH /api/admin/menu/categories/[id]`
Field opsional: `name`, `tagline`, `image`, `sortOrder`, `archived`.
- `archived: true` pada kategori yang masih punya item aktif →
  `409 CATEGORY_NOT_EMPTY`.

### `POST /api/admin/menu/items`
```json
{
  "id": "roti-bakar-coklat",
  "categoryId": "snack",
  "name": "Roti Bakar Coklat",
  "description": "",
  "basePrice": 15000,
  "unit": "porsi",
  "isBestSeller": false,
  "isAddOnItem": false,
  "sortOrder": 1,
  "variants": [
    { "id": "reguler", "name": "Reguler", "price": 15000, "sortOrder": 1 },
    { "id": "jumbo", "name": "Jumbo", "price": 20000, "sortOrder": 2 }
  ],
  "addOnIds": ["keju"]
}
```
- `categoryId` tidak dikenal/diarsip → `404 CATEGORY_NOT_FOUND`.
- `addOnIds` tidak dikenal → `404 ADDON_NOT_FOUND`.
- ID item duplikat → `409 DUPLICATE_SLUG`.

### `PATCH /api/admin/menu/items/[id]`
Field opsional (semua dari create) + `available`, `archived`. Pengiriman
`variants` / `addOnIds` bersifat **replace**: relasi lama dihapus lalu diganti.
- Header item, seluruh varian, dan seluruh tautan add-on disimpan oleh satu RPC
  transaksi. Kegagalan insert mana pun me-rollback semua perubahan.
- Bila `archived: false`, admin bisa memulihkan item dari arsip.

### `POST /api/admin/menu/items/[id]/image`
- `multipart/form-data`, field `file`.
- Maks 3MB asli; hanya JPG/PNG/WebP. Dioptimasi ke WebP ≤ 250KB via `sharp`,
  disimpan di bucket publik `menu-images` sebagai `<itemId>.<uuid>.webp`.
- `image_path` pada `menu_items` diperbarui ke URL publik.
- Rate-limit `menuimg:<ip>` 6/menit. Lewat batas → `429 RATE_LIMITED`.
- Berkas 5MB → `413 PAYLOAD_TOO_LARGE`; non-gambar → `400 VALIDATION_ERROR`.

### `DELETE /api/admin/menu/items/[id]`
Soft delete: set `archived = true`. Item tetap ada di DB; pesanan lama tetap
punya nama item tercatat di `order_items`. Tidak ada item → `404 NOT_FOUND`.

### `GET /api/admin/menu/addons` & `POST` / `PATCH/[id]`
Add-on global reusable lintas item.
- `GET`: `{ "success": true, "data": { "addOns": [...] } }`
- `POST`: `{ "id": "keju", "name": "Tambah Keju", "price": 8000 }`
- `PATCH /[id]`: field opsional `name`, `price`. (Hapus pakai mengosongkan
  tautan — arsip add-on belum diimplementasikan; catat sebagai debt bila
  dibutuhkan.)

### Kode error umum admin menu

| Kode | Kondisi |
|---|---|
| `401 UNAUTHORIZED` | Bukan admin / sesi expired |
| `503 FITUR_BELUM_AKTIF` | DB belum dikonfigurasi |
| `400 VALIDATION_ERROR` | Zod gagal |
| `404 NOT_FOUND` | Item/kategori/add-on tidak ditemukan |
| `404 CATEGORY_NOT_FOUND` | `categoryId` tidak ada/diarsip |
| `404 ADDON_NOT_FOUND` | `addOnIds` tidak dikenal |
| `409 DUPLICATE_SLUG` | ID item/kategori/varian/add-on sudah dipakai |
| `409 CATEGORY_NOT_EMPTY` | Arsip kategori yang masih punya item aktif |
| `429 RATE_LIMITED` | Upload gambar terlalu sering |
| `413 PAYLOAD_TOO_LARGE` | Berkas > 3MB |
| `500 INTERNAL_ERROR` | Kegagalan tak terduga |

---

## 11.9 `GET /api/rekap?tanggal=YYYY-MM-DD` (admin)

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

## 11.10 Konvensi umum

1. Format sukses: `{ "success": true, "data": {...} }`
2. Format gagal: `{ "success": false, "error": "KODE_ERROR", "message": "pesan ramah" }`
3. Kode error menggunakan `SCREAMING_SNAKE_CASE`.
4. `message` selalu Bahasa Indonesia (langsung bisa ditampilkan ke pengguna).
5. Semua endpoint tulis wajib memvalidasi ulang input di server.
6. Rate limit `POST /api/orders`: maksimal 5 permintaan per IP per menit.
7. Jangan pernah mengembalikan `SUPABASE_SERVICE_ROLE_KEY` atau data internal lain.

---

➡️ Lanjut ke `12_PAYMENT_QRIS.md`
