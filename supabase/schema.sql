-- ============================================================
-- MAU'S Kitchen — Skema Supabase (Fase 2)
-- Jalankan seluruh file ini di Supabase SQL Editor (satu kali).
-- Sumber: docs/10_DATA_MODEL.md §10.3–§10.4 + docs/17_DEPLOYMENT.md §17.5
-- ============================================================

-- Tabel pesanan
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- MK-260814-001
  public_token    text unique not null default
                  (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  idempotency_key uuid,
  request_fingerprint text check (
                        request_fingerprint is null or length(request_fingerprint) = 64
                      ),
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
  delivery_provider text check (
                      delivery_provider is null
                      or delivery_provider in ('internal','gosend','grabexpress','other')
                    ),
  courier_cost    integer check (courier_cost is null or courier_cost >= 0),
  total           integer not null check (total >= 0),

  payment_method  text not null check (payment_method in ('qris','transfer','tunai')),
  payment_proof_url text,
  -- Waktu pelanggan menekan "Saya Sudah Bayar" (klaim, bukan verifikasi admin).
  payment_claimed_at timestamptz,
  -- Diisi server saat admin benar-benar menyetujui verifikasi manual.
  payment_verified_at timestamptz,

  status          text not null default 'BARU'
                  check (status in ('BARU','DIKONFIRMASI','DIPROSES','DIKIRIM','SELESAI','BATAL')),
  admin_note      text,

  constraint orders_pickup_delivery_fee_zero
    check (order_type <> 'ambil' or delivery_fee = 0),
  constraint orders_delivery_fulfillment_coherent
    check (
      (order_type = 'ambil' and delivery_provider is null and courier_cost is null)
      or (
        order_type = 'antar'
        and (
          (delivery_provider is null and courier_cost is null)
          or (delivery_provider = 'internal' and courier_cost = 0)
          or (delivery_provider in ('gosend','grabexpress','other') and courier_cost is not null)
        )
      )
    ),
  constraint orders_cash_delivery_internal_only
    check (
      order_type <> 'antar'
      or payment_method <> 'tunai'
      or delivery_provider is null
      or delivery_provider = 'internal'
    ),
  constraint orders_total_matches_components
    check (total = subtotal + coalesce(delivery_fee, 0)),
  constraint orders_payment_requires_final_total
    check (
      order_type <> 'antar'
      or (
        delivery_fee is not null
        and delivery_provider is not null
        and courier_cost is not null
      )
      or (payment_claimed_at is null and payment_proof_url is null)
    ),
  constraint orders_confirmed_delivery_requires_plan
    check (
      order_type <> 'antar'
      or status in ('BARU', 'BATAL')
      or (
        delivery_fee is not null
        and delivery_provider is not null
        and courier_cost is not null
      )
    )
);

-- Aman dijalankan untuk project lama yang dibuat sebelum token publik ada.
alter table public.orders add column if not exists public_token text;
update public.orders
set public_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where public_token is null;
alter table public.orders alter column public_token set default
  (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
alter table public.orders alter column public_token set not null;
create unique index if not exists orders_public_token_idx on public.orders (public_token);

-- Retry checkout memakai key yang sama agar kegagalan jaringan tidak membuat
-- dua pesanan. Nullable menjaga kompatibilitas dengan baris lama.
alter table public.orders add column if not exists idempotency_key uuid;
alter table public.orders add column if not exists request_fingerprint text;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_request_fingerprint_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_request_fingerprint_check
      check (request_fingerprint is null or length(request_fingerprint) = 64);
  end if;
end $$;
create unique index if not exists orders_idempotency_key_idx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- Aman untuk project lama: kolom klaim pembayaran pelanggan.
alter table public.orders add column if not exists payment_claimed_at timestamptz;
alter table public.orders add column if not exists payment_verified_at timestamptz;
alter table public.orders add column if not exists delivery_provider text;
alter table public.orders add column if not exists courier_cost integer;

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

-- Counter persisten per tanggal WIB. UPSERT pada primary key mengunci satu
-- baris secara atomik, sehingga checkout serentak tidak memilih kode sama.
create table if not exists public.order_daily_sequences (
  day_key text primary key check (day_key ~ '^[0-9]{6}$'),
  last_value integer not null check (last_value > 0),
  updated_at timestamptz not null default now()
);

insert into public.order_daily_sequences (day_key, last_value)
select
  substring(code from 4 for 6),
  max((substring(code from 11 for 3))::integer)
from public.orders
where code ~ '^MK-[0-9]{6}-[0-9]{3}$'
group by substring(code from 4 for 6)
on conflict (day_key) do update
set
  last_value = greatest(
    public.order_daily_sequences.last_value,
    excluded.last_value
  ),
  updated_at = now();

create or replace function public.insert_order_with_items_v2(
  p_order jsonb,
  p_items jsonb
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_order_id uuid;
  order_day_key text;
  order_sequence integer;
  allocated_code text;
begin
  if jsonb_typeof(p_order) <> 'object'
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Invalid order payload';
  end if;

  order_day_key := to_char(
    transaction_timestamp() at time zone 'Asia/Jakarta',
    'YYMMDD'
  );

  -- ponytail: one row serializes a WIB day's allocation; widen the public code
  -- suffix before volume approaches 999 successful orders per day.
  insert into public.order_daily_sequences (day_key, last_value)
  values (order_day_key, 1)
  on conflict (day_key) do update
  set
    last_value = public.order_daily_sequences.last_value + 1,
    updated_at = now()
  returning last_value into order_sequence;

  if order_sequence > 999 then
    raise exception using errcode = '54000', message = 'Daily order code capacity exceeded';
  end if;

  allocated_code := 'MK-' || order_day_key || '-' || lpad(order_sequence::text, 3, '0');

  insert into public.orders (
    code,
    public_token,
    idempotency_key,
    request_fingerprint,
    customer_name,
    customer_wa,
    order_type,
    address,
    address_note,
    scheduled_at,
    customer_note,
    subtotal,
    delivery_fee,
    delivery_provider,
    courier_cost,
    total,
    payment_method,
    payment_proof_url,
    payment_claimed_at,
    payment_verified_at,
    status,
    admin_note
  )
  values (
    allocated_code,
    p_order ->> 'public_token',
    (p_order ->> 'idempotency_key')::uuid,
    p_order ->> 'request_fingerprint',
    p_order ->> 'customer_name',
    p_order ->> 'customer_wa',
    p_order ->> 'order_type',
    p_order ->> 'address',
    p_order ->> 'address_note',
    (p_order ->> 'scheduled_at')::timestamptz,
    p_order ->> 'customer_note',
    (p_order ->> 'subtotal')::integer,
    (p_order ->> 'delivery_fee')::integer,
    p_order ->> 'delivery_provider',
    (p_order ->> 'courier_cost')::integer,
    (p_order ->> 'total')::integer,
    p_order ->> 'payment_method',
    p_order ->> 'payment_proof_url',
    (p_order ->> 'payment_claimed_at')::timestamptz,
    null,
    p_order ->> 'status',
    p_order ->> 'admin_note'
  )
  returning id into new_order_id;

  insert into public.order_items (
    order_id,
    item_id,
    item_name,
    variant_id,
    variant_name,
    unit_price,
    add_ons,
    note,
    quantity,
    subtotal
  )
  select
    new_order_id,
    item ->> 'item_id',
    item ->> 'item_name',
    item ->> 'variant_id',
    item ->> 'variant_name',
    (item ->> 'unit_price')::integer,
    coalesce(item -> 'add_ons', '[]'::jsonb),
    item ->> 'note',
    (item ->> 'quantity')::integer,
    (item ->> 'subtotal')::integer
  from jsonb_array_elements(p_items) as items(item);

  return allocated_code;
end;
$$;

revoke all on function public.insert_order_with_items_v2(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.insert_order_with_items_v2(jsonb, jsonb)
  to service_role;

create or replace function public.enforce_manual_payment_verification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'BARU'
    and new.status not in ('BARU', 'BATAL')
    and new.payment_method in ('qris', 'transfer')
    and (
      (new.payment_claimed_at is null and new.payment_proof_url is null)
      or new.payment_verified_at is null
    ) then
    raise exception using
      errcode = '23514',
      message = 'Manual payment verification required';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_manual_payment_verification on public.orders;
create trigger orders_enforce_manual_payment_verification
  before update of status on public.orders
  for each row execute function public.enforce_manual_payment_verification();

revoke all on function public.enforce_manual_payment_verification()
  from public, anon, authenticated;

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
-- Antrean verifikasi admin: pesanan yang sudah diklaim bayar pelanggan.
create index if not exists orders_payment_claimed_idx
  on public.orders (payment_claimed_at desc)
  where payment_claimed_at is not null;

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
alter table public.order_daily_sequences enable row level security;
alter table public.menu_overrides enable row level security;

revoke all on table public.order_daily_sequences from public, anon, authenticated;
grant select, insert, update on table public.order_daily_sequences to service_role;

-- Rate limiter terdistribusi. Tabel ini hanya diakses lewat service role.
create table if not exists public.rate_limits (
  key_hash          text primary key,
  window_started_at timestamptz not null default now(),
  hit_count         integer not null default 1 check (hit_count > 0),
  updated_at        timestamptz not null default now()
);
alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_key_hash text,
  p_window_seconds integer,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_window_seconds < 1 or p_max_requests < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.rate_limits (key_hash, window_started_at, hit_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
  set
    hit_count = case
      when public.rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.hit_count + 1
    end,
    window_started_at = case
      when public.rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limits.window_started_at
    end,
    updated_at = now()
  returning hit_count into current_count;

  delete from public.rate_limits
  where updated_at < now() - interval '1 day';

  return current_count > p_max_requests;
end;
$$;

revoke all on table public.rate_limits from anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Publik boleh membaca ketersediaan menu (dipakai halaman katalog ISR)
drop policy if exists menu_overrides_public_read on public.menu_overrides;
create policy "menu_overrides_public_read"
  on public.menu_overrides for select using (true);

-- Hanya user dengan custom claim app_metadata.role=admin. Route dashboard
-- tetap memakai service role setelah allowlist email diverifikasi di server.
drop policy if exists orders_admin_all on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists order_items_admin_all on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Bucket bukti bayar privat dengan batas yang sama seperti API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
