-- ============================================================
-- MAU'S Kitchen — Klaim pembayaran oleh pelanggan
-- Pelanggan menekan "Saya Sudah Bayar" di /pembayaran/[kode]; waktu klaim
-- dicatat di sini. Status pesanan TIDAK berubah — verifikasi tetap milik
-- admin (docs/04_BUSINESS_FLOW.md §4.3, docs/10_DATA_MODEL.md §10.3).
-- Idempoten: aman dijalankan berulang.
-- ============================================================

alter table public.orders
  add column if not exists payment_claimed_at timestamptz;

-- Antrean verifikasi admin: pesanan BARU yang sudah diklaim bayar.
create index if not exists orders_payment_claimed_idx
  on public.orders (payment_claimed_at desc)
  where payment_claimed_at is not null;
