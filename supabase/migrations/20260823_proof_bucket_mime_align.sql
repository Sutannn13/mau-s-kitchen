-- Selaraskan bucket `payment-proofs` dengan kontrak unggah bukti bayar.
--
-- Latar: migrasi 20260816_security_hardening.sql membatasi bucket ke
-- `image/webp` saja, sementara:
--   * API menyimpan berkas apa adanya sebagai JPG/PNG/WebP
--     (src/lib/proof-image.ts — tanpa konversi karena `sharp` tidak jalan di
--     runtime Cloudflare Workers),
--   * UI menjanjikan "JPG/PNG/WebP, maks 4MB"
--     (src/components/common/PaymentProofActions.tsx),
--   * preflight go-live mengharapkan ketiga MIME tersebut
--     (scripts/security-preflight.mjs).
-- Akibatnya, pada project yang sudah menjalankan migrasi keamanan, unggahan
-- JPEG/PNG (kasus paling umum: screenshot m-banking) ditolak storage dan
-- pelanggan hanya melihat "Gagal menyimpan berkas. Coba lagi." tanpa jalan
-- keluar; `npm run build:production` juga gagal di preflight.
--
-- Idempoten: aman dijalankan ulang.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
