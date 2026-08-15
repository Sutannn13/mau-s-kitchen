-- ============================================================
-- MAU'S Kitchen — Skema Supabase (Fase 2)
-- Jalankan seluruh file ini di Supabase SQL Editor (satu kali).
-- Sumber: docs/10_DATA_MODEL.md §10.3–§10.4 + docs/17_DEPLOYMENT.md §17.5
-- ============================================================

-- Tabel pesanan
create table if not exists public.orders (
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
create table if not exists public.order_items (
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
create table if not exists public.menu_overrides (
  item_id     text primary key,
  available   boolean not null default true,
  price_override integer,
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Trigger updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.menu_overrides enable row level security;

-- Publik boleh membaca ketersediaan menu (dipakai halaman katalog ISR)
drop policy if exists menu_overrides_public_read on public.menu_overrides;
create policy "menu_overrides_public_read"
  on public.menu_overrides for select using (true);

-- Hanya user terautentikasi (admin) yang boleh membaca & mengubah pesanan
drop policy if exists orders_admin_all on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists order_items_admin_all on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- Catatan langkah manual berikutnya (dashboard Supabase):
-- 1. Authentication → Providers → Email: aktifkan,
--    MATIKAN "Allow new users to sign up" (registrasi mandiri ditutup).
-- 2. Authentication → Users → "Add user" untuk akun admin
--    (email + password, centang "Auto Confirm User").
-- 3. Storage → New bucket → nama: payment-proofs → PRIVATE.
--    Tulis/muat hanya lewat service role key di server, jadi tidak
--    perlu policy storage tambahan.
-- ============================================================
