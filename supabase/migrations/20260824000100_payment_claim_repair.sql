-- Repair untuk proyek yang menjalankan 20260824_order_integrity.sql sebelum
-- 20260823_payment_claim.sql. Fungsi checkout tanggal 24 membaca kolom ini;
-- tanpa kolom, checkout gagal saat runtime walau CREATE FUNCTION sukses.

begin;

alter table public.orders
  add column if not exists payment_claimed_at timestamptz;

create index if not exists orders_payment_claimed_idx
  on public.orders (payment_claimed_at desc)
  where payment_claimed_at is not null;

commit;
