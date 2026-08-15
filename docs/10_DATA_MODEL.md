# 10 — Data Model

## 10.1 Tipe TypeScript — Menu

```ts
// types/menu.ts

export type CategoryId = "taichan" | "minuman" | "chocoberry"

export interface MenuCategory {
  id: CategoryId
  name: string
  tagline: string
  image: string
  order: number
}

export interface MenuVariant {
  id: string          // "small" | "medium"
  name: string        // "Small" | "Medium"
  price: number       // rupiah penuh, contoh 35000
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
  unit: "porsi" | "cup"
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
  total: number
  paymentMethod: PaymentMethod
  paymentProofUrl?: string
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
  delivery_fee    integer,
  total           integer not null check (total >= 0),

  payment_method  text not null check (payment_method in ('qris','transfer','tunai')),
  payment_proof_url text,

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

Urutan harian diambil dari `count(*) + 1` pesanan pada tanggal berjalan (zona Asia/Jakarta).
Sebelum database aktif (Fase 1), gunakan 3 karakter acak sebagai gantinya dan tandai `TODO`.

---

➡️ Lanjut ke `11_API_SPEC.md`
