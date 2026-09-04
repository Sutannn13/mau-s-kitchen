# 10 — Data Model

## 10.1 Tipe TypeScript — Menu

```ts
// types/menu.ts

// CategoryId sekarang dinamis (admin bisa buat kategori baru lewat dashboard).
// Tetap di-export sebagai alias string agar kode lama tetap kompilasi.
export type CategoryId = string

export interface MenuCategory {
  id: CategoryId
  name: string
  tagline: string
  image: string
  order: number
  updatedAt?: string
}

export interface MenuVariant {
  id: string          // "small" | "medium"
  name: string        // "Small" | "Medium"
  price: number       // rupiah penuh, contoh 35000
  sortOrder?: number
}

export interface MenuAddOn {
  id: string          // "pistacio-kunava"
  name: string        // "Pistacio Kunava"
  price: number       // 8000
}

export interface MenuItem {
  id: string
  categoryId: CategoryId
  name: string
  description: string
  basePrice: number           // harga termurah (dipakai untuk "mulai dari")
  variants: MenuVariant[]     // kosong = tanpa varian
  addOns: MenuAddOn[]         // kosong = tanpa add-on
  image: string
  available: boolean
  isBestSeller: boolean
  isAddOnItem?: boolean       // true untuk Lontong & Sambel Taichan
  unit: "porsi" | "cup" | "item"
  sortOrder?: number
  updatedAt?: string
}

export interface MenuData {
  version: string
  updatedAt: string
  currency: "IDR"
  brand: {
    name: string
    tagline: string
    whatsapp: string
    whatsappDisplay: string
  }
  categories: MenuCategory[]
  items: MenuItem[]
  archivedItems: { id: string; name: string; reason: string }[]
}
```

> Setelah fitur FR-27 (Admin CRUD Menu), sumber kebenaran utama pindah ke tabel
> `menu_items` di Supabase. `data/menu.json` tetap sebagai seed awal + fallback
> read-only bila Supabase tidak tersedia. `CategoryId` diubah dari union literal
> menjadi `string` karena kategori sekarang dinamis.

## 10.2 Tipe TypeScript — Keranjang & Pesanan

```ts
// types/order.ts

export interface CartItem {
  lineId: string             // hash unik dari itemId + variantId + addOnIds + note
  itemId: string
  name: string
  image: string
  variantId: string | null
  variantName: string | null
  unitPrice: number          // harga varian (atau basePrice jika tanpa varian)
  addOns: MenuAddOn[]
  note?: string
  quantity: number
}

/** subtotal = (unitPrice + sum(addOns.price)) * quantity */

export type OrderType = "antar" | "ambil"
export type PaymentMethod = "qris" | "transfer" | "tunai"
export type OrderStatus =
  | "BARU"
  | "DIKONFIRMASI"
  | "DIPROSES"
  | "DIKIRIM"
  | "SELESAI"
  | "BATAL"

export interface CustomerInfo {
  name: string
  whatsapp: string           // dinormalisasi ke 62xxxxxxxxxx
  orderType: OrderType
  address?: string
  addressNote?: string
  scheduledAt?: string       // ISO string, kosong = secepatnya
  note?: string
}

export interface Order {
  code: string               // MK-YYMMDD-XXX
  createdAt: string          // ISO
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  deliveryFee: number | null // null = dikonfirmasi admin
  deliveryProvider: 'internal' | 'gosend' | 'grabexpress' | 'other' | null
  courierCost: number | null // biaya aktual internal; tidak diekspos ke pelanggan
  total: number
  paymentMethod: PaymentMethod
  paymentProofUrl?: string
  paymentClaimedAt?: string   // klaim pelanggan "sudah bayar", bukan verifikasi admin
  status: OrderStatus
  adminNote?: string
  updatedAt: string
}
```

## 10.3 Skema database (Supabase / Postgres)

```sql
-- Tabel pesanan
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- MK-260814-001
  public_token    text unique not null,                -- bearer token guest access
  idempotency_key uuid,                                -- satu key per percobaan checkout
  request_fingerprint text,                            -- SHA-256 payload (64 hex)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  customer_name   text not null,
  customer_wa     text not null,                      -- 62xxxxxxxxxx
  order_type      text not null check (order_type in ('antar','ambil')),
  address         text,
  address_note    text,
  scheduled_at    timestamptz,
  customer_note   text,

  subtotal        integer not null check (subtotal >= 0),
  delivery_fee    integer check (delivery_fee is null or delivery_fee >= 0),
  delivery_provider text check (delivery_provider is null or delivery_provider in ('internal','gosend','grabexpress','other')),
  courier_cost    integer check (courier_cost is null or courier_cost >= 0),
  total           integer not null check (total >= 0),

  payment_method  text not null check (payment_method in ('qris','transfer','tunai')),
  payment_proof_url text,
  -- Waktu pelanggan menekan "Saya Sudah Bayar" di /pembayaran/[kode].
  -- Klaim saja: status tetap BARU sampai admin memverifikasi (§4.3).
  payment_claimed_at timestamptz,
  -- Diisi server ketika admin menyelesaikan verifikasi manual.
  payment_verified_at timestamptz,
  -- Reference mutasi merchant, dinormalisasi uppercase dan unik lintas order.
  -- Wajib untuk QRIS baru yang bergerak keluar dari BARU.
  payment_reference text,

  status          text not null default 'BARU'
                  check (status in ('BARU','DIKONFIRMASI','DIPROSES','DIKIRIM','SELESAI','BATAL')),
  admin_note      text
);

-- Tabel item pesanan
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  item_id       text not null,
  item_name     text not null,
  variant_id    text,
  variant_name  text,
  unit_price    integer not null,
  add_ons       jsonb not null default '[]'::jsonb,   -- [{id,name,price}]
  note          text,
  quantity      integer not null check (quantity > 0),
  subtotal      integer not null
);

-- Ketersediaan & override harga menu (dikelola admin)
create table public.menu_overrides (
  item_id     text primary key,
  available   boolean not null default true,
  price_override integer,
  updated_at  timestamptz not null default now()
);

-- ==== FR-27: Admin CRUD Menu Mandiri ====
-- Sumber kebenaran katalog pindah dari data/menu.json ke tabel berikut.
-- Lihat supabase/migrations/20260817_menu_crud.sql untuk definisi penuh
-- (RLS, trigger updated_at, seed dari data/menu.json, bucket menu-images).

create table public.menu_categories (
  id          text primary key,
  name        text not null,
  tagline     text not null default '',
  image       text not null default '',
  sort_order  integer not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.menu_items (
  id             text primary key,
  category_id    text not null references public.menu_categories(id) on delete restrict,
  name           text not null,
  description    text not null default '',
  base_price     integer not null check (base_price >= 0),
  image_path     text not null default '',
  available      boolean not null default true,
  is_best_seller boolean not null default false,
  is_addon_item  boolean not null default false,
  unit           text not null check (unit in ('porsi','cup','item')),
  sort_order     integer not null default 0,
  archived       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.menu_variants (
  id         text not null,
  item_id    text not null references public.menu_items(id) on delete cascade,
  name       text not null,
  price      integer not null check (price >= 0),
  sort_order integer not null default 0,
  primary key (item_id, id)
);

create table public.menu_addons (
  id    text primary key,
  name  text not null,
  price integer not null check (price >= 0)
);

create table public.menu_item_addons (
  item_id  text not null references public.menu_items(id) on delete cascade,
  addon_id text not null references public.menu_addons(id) on delete restrict,
  primary key (item_id, addon_id)
);
```

Invariant biaya pada database:

- `ambil` wajib `delivery_fee = 0`.
- `ambil` wajib `delivery_provider = null` dan `courier_cost = null`.
- `total = subtotal + coalesce(delivery_fee, 0)`.
- Provider `internal` wajib `courier_cost = 0`; provider eksternal wajib memiliki
  biaya aktual, termasuk nilai Rp0 bila memang promo/gratis.
- Delivery Tunai/COD hanya boleh memakai provider `internal`.
- Delivery dengan klaim/bukti pembayaran wajib memiliki ongkir, provider, dan
  biaya kurir aktual.
- Delivery tidak boleh melewati status `BARU` tanpa rencana lengkap, kecuali
  `BATAL`. Pesanan final sebelum migrasi fulfillment tetap disimpan sebagai
  histori tanpa mengarang provider yang tidak pernah dicatat.

> **Catatan transisi:** tabel `menu_overrides` sengaja tidak dihapus pada
> migration `20260817_menu_crud.sql` untuk kompatibilitas mundur singkat.
> Setelah semua kode membaca `menu_items.available` langsung, hapus via
> migration cleanup terpisah. Loader `src/lib/menu-data.ts` sudah tidak
> membaca `menu_overrides`.
>
> Storage bucket publik `menu-images` (3MB, JPG/PNG/WebP) menyimpan foto
> menu hasil optimasi sharp ke WebP. `brand`/`version`/`updatedAt` dari
> `data/menu.json` tetap dipakai sebagai konfigurasi statis (tidak pindah ke
> tabel) dan disertakan oleh loader fallback.

```sql
-- Index
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx     on public.orders (status);
create index order_items_order_idx on public.order_items (order_id);

-- Trigger updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();
```

## 10.4 Row Level Security (RLS)

```sql
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.menu_overrides enable row level security;

-- Publik boleh membaca ketersediaan menu
create policy "menu_overrides_public_read"
  on public.menu_overrides for select using (true);

-- Hanya admin (user terautentikasi) yang boleh membaca & mengubah pesanan
create policy "orders_admin_all"
  on public.orders for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "order_items_admin_all"
  on public.order_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

> Pembuatan pesanan oleh pelanggan dilakukan **lewat route handler server**
> menggunakan `SUPABASE_SERVICE_ROLE_KEY`, bukan langsung dari browser.
> Ini mencegah pelanggan membaca pesanan orang lain.

## 10.5 Aturan perhitungan harga

```ts
// lib/pricing.ts
export const lineSubtotal = (item: CartItem): number => {
  const addOnTotal = item.addOns.reduce((s, a) => s + a.price, 0)
  return (item.unitPrice + addOnTotal) * item.quantity
}

export const cartSubtotal = (items: CartItem[]): number =>
  items.reduce((s, i) => s + lineSubtotal(i), 0)

export const orderTotal = (subtotal: number, deliveryFee: number | null): number =>
  subtotal + (deliveryFee ?? 0)
```

Aturan:
1. Semua nilai uang **integer rupiah**. Dilarang menggunakan `float`.
2. Tidak ada pembulatan; harga menu sudah bilangan bulat ribuan.
3. Tidak ada pajak tambahan (BR-01).
4. `deliveryFee = null` ditampilkan sebagai "dikonfirmasi admin", bukan `Rp0`.

## 10.6 Format kode pesanan

```
MK - YYMMDD - XXX
│    │        └─ nomor urut harian, 3 digit, mulai 001
│    └─ tanggal (Asia/Jakarta)
└─ prefix MAU'S Kitchen

Contoh: MK-260814-007
```

```ts
// lib/order-code.ts
export const buildOrderCode = (date: Date, sequence: number): string => {
  const jakarta = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "2-digit", month: "2-digit", day: "2-digit",
  }).formatToParts(date)
  const get = (t: string) => jakarta.find((p) => p.type === t)!.value
  return `MK-${get("year")}${get("month")}${get("day")}-${String(sequence).padStart(3, "0")}`
}
```

Urutan harian dialokasikan atomik oleh RPC `insert_order_with_items_v2` melalui
UPSERT baris `order_daily_sequences` untuk tanggal berjalan (zona Asia/Jakarta).
Alokasi kode, insert header, dan insert item berada dalam satu transaksi. Burst
checkout serentak akan antre singkat pada counter harian, bukan berebut kode atau
gagal setelah retry. Counter tidak ikut dihapus oleh retensi pesanan sehingga kode
lama tidak dipakai ulang. Mode development tanpa database tetap memakai angka acak.

## 10.7 Invoice

Invoice tidak menambah tabel atau nomor baru. `orders.code` menjadi nomor invoice,
sedangkan rincian memakai snapshot `orders` + `order_items` agar perubahan menu
setelah checkout tidak mengubah dokumen lama. Invoice hanya dirender bila status
`DIKONFIRMASI`, `DIPROSES`, `DIKIRIM`, atau `SELESAI`, dan akses pelanggan tetap
memerlukan pasangan kode + `public_token`.

---

### Security hardening produksi

- `orders.public_token` menyimpan token akses acak terpisah dari `code` yang
  mudah dibaca. Token tidak boleh muncul pada daftar admin, log, atau response
  publik selain URL yang diterima pembuat pesanan.
- `order_daily_sequences` mengalokasikan suffix kode di dalam transaksi insert;
  constraint unique `orders.code` tetap menjadi pertahanan terakhir.
- `orders.idempotency_key` memiliki unique index parsial. Header dan seluruh
  `order_items` ditulis oleh RPC `insert_order_with_items` dalam satu transaksi;
  retry payload yang sama mengembalikan order pertama, sedangkan key yang sama
  dengan fingerprint berbeda ditolak.
- Update item menu beserta replace varian/add-on memakai RPC
  `admin_update_menu_item`, sehingga kegagalan satu relasi me-rollback semuanya.
- `rate_limits` dan RPC `check_rate_limit` menyediakan limit atomik lintas
  instance; key IP disimpan sebagai hash HMAC.
- Policy `orders`/`order_items` memerlukan `app_metadata.role=admin`.
- Perubahan untuk project lama ada di
  `supabase/migrations/20260816_security_hardening.sql` dan
  `supabase/migrations/20260824_order_integrity.sql`.
- Migrasi `supabase/migrations/20260830000100_atomic_order_codes.sql` wajib
  diterapkan sebelum kode aplikasi terbaru agar checkout serentak tidak berebut
  kode dan RPC mengembalikan kode final ke server. RPC v1 sengaja tidak dihapus:
  migrasi dapat diterapkan sebelum deploy tanpa merusak aplikasi production lama.
- Migrasi atomic order menambah `payment_verified_at`. Hardening berikutnya di
  `20260904053000_harden_qris_verification.sql` menambah `payment_reference`
  unik. QRIS tidak dapat meninggalkan `BARU` tanpa bukti, reference, dan jejak
  verifikasi admin; transfer tetap membutuhkan klaim/bukti dan verifikasi.
- Project yang terlanjur menjalankan migrasi integritas sebelum migrasi klaim
  pembayaran wajib menjalankan
  `supabase/migrations/20260824000100_payment_claim_repair.sql`. Tanpa kolom
  `orders.payment_claimed_at`, RPC checkout baru gagal saat dipanggil walau
  pembuatan fungsi sebelumnya dilaporkan sukses.
- Kontrak ongkir pickup/delivery dan repair total historis ada di
  `supabase/migrations/20260824114955_delivery_pricing_integrity.sql`; validasi
  legacy dilanjutkan oleh `20260824115452_validate_legacy_delivery_pricing.sql`.
- Setelah klien service-role Supabase terkonfigurasi, error database tidak boleh
  jatuh ke penyimpanan RAM. Checkout harus gagal eksplisit agar tidak tercipta
  pesanan bayangan yang tidak dapat dilihat atau diperbarui admin.

➡️ Lanjut ke `11_API_SPEC.md`
