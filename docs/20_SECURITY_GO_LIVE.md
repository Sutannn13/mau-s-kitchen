# 20 — Security & Go-Live Railway/Netlify

Dokumen ini adalah release gate. Website tidak boleh menerima pesanan produksi
sebelum seluruh bagian wajib di bawah lulus.

## Perubahan keamanan yang sudah diterapkan

- Akses admin memerlukan sesi valid serta `ADMIN_EMAILS` atau custom claim admin.
- RLS pesanan menolak user authenticated biasa.
- Status, pembayaran, API publik, dan upload bukti memerlukan token acak 256-bit.
- Browser menerima gambar asli maksimal 4MB, mendecode dan mengecilkannya
  (target 700KB, hasil maksimal 1MiB). Server memvalidasi ulang ukuran,
  signature, struktur container, dan dimensi sebelum menyimpan ke bucket privat;
  bukti hanya dapat dikirim sekali saat `BARU`.
- Checkout dan upload bukti membatasi body saat stream dibaca, termasuk request
  chunked tanpa `Content-Length`. Checkout juga memiliki batas item/kuantitas,
  rate limiter Supabase lintas instance, dan gagal aman saat database atau
  ketersediaan menu bermasalah.
- Identitas rate limit produksi hanya memakai `CF-Connecting-IP` yang valid;
  header proxy generik diabaikan. Lookup pesanan memvalidasi format kode dan
  dibatasi sebelum query, sedangkan `/api/health` dibatasi dan dapat di-cache
  singkat. Aktifkan rate-limit rule/binding Cloudflare sebagai lapisan pra-DB.
- Penyimpanan RAM hanya tersedia pada development/test; produksi mengembalikan
  `503` bila Supabase tidak siap.
- Header CSP, anti-frame, no-referrer, nosniff, Permissions Policy, dan HSTS
  produksi dipasang dari `next.config.ts`.

## Langkah manual Supabase — wajib

1. Rotasi service role key bila pernah tampil di log, chat, screenshot, atau
   terminal yang dibagikan. Perbarui secret hanya pada host dan `.env.local`.
2. Jalankan `supabase/migrations/20260816_security_hardening.sql` di SQL Editor.
3. Jalankan `supabase/migrations/20260823_proof_bucket_mime_align.sql` — wajib
   bila migrasi poin 2 pernah dijalankan, karena migrasi lama membatasi bucket
   ke `image/webp` saja sehingga unggahan JPG/PNG (screenshot m-banking) ditolak
   storage dan preflight go-live gagal.
4. Jalankan
   `supabase/migrations/20260824212500_limit_payment_proofs_to_one_mb.sql` untuk
   menetapkan hard limit bucket 1MiB.
5. Matikan **Allow new users to sign up**.
6. Audit daftar user; sisakan hanya akun admin sah.
7. Pastikan bucket `payment-proofs` private, maksimum 1MiB, dan hanya menerima
   `image/jpeg`, `image/png`, `image/webp`. Migration mengaturnya otomatis.

## Environment produksi — wajib

- Domain HTTPS final, Supabase URL/publishable key/service role key.
- `ADMIN_EMAILS` berisi email admin sah dan `RATE_LIMIT_SALT` acak ≥32 karakter.
- `ORDER_RETENTION_DAYS` ditetapkan pemilik antara 30–3650 hari.
- Jam operasional dan alamat dikonfirmasi pemilik.
- QRIS/transfer tetap `false` sampai aset/rekening asli tersedia; tunai dapat
  tetap aktif bila memang diterima usaha.

## Verifikasi dan operasi

```bash
npm run typecheck
npm run lint
npm test
npm audit --omit=dev
npm run security:preflight
npm run build:production
```

Setelah preview aktif, uji 360px/768px/1280px, login admin sah dan tidak sah,
checkout, status dengan token salah/benar, upload palsu/duplikat, serta response
header. Jadwalkan `npm run data:purge` setiap hari dan pantau error `5xx`, lonjakan
`429`, kegagalan upload, serta healthcheck `/api/health`.
