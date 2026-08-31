# 17 — Deployment

## 17.1 Lingkungan

| Lingkungan | URL | Cabang Git | Tujuan |
|---|---|---|---|
| Development | `http://localhost:3000` | `feature/*` | Pengembangan lokal |
| Preview | `*.workers.dev` | Pull request / manual | Review sebelum rilis |
| Staging | `https://staging.maukitchen.my.id` | `codex/staging` | Uji integrasi dengan data non-produksi |
| Production | `https://maukitchen.my.id` | `main` | Publik |

---

## 17.2 Deploy ke Vercel (langkah demi langkah)

```bash
# 1. Push repo ke GitHub
git init
git add .
git commit -m "chore: initial commit dokumentasi + aplikasi"
git branch -M main
git remote add origin https://github.com/<akun>/maus-kitchen-web.git
git push -u origin main
```

Lalu di dashboard Vercel:

1. **Add New Project** → Import repository GitHub.
2. Framework Preset: **Next.js** (terdeteksi otomatis).
3. Build Command: `npm run build:vercel` · Output: `.next` (default).
   Wrapper memakai `npm run build` untuk Preview dan
   `npm run build:production` untuk Production.
4. Tambahkan semua Environment Variables (lihat 17.3).
5. Klik **Deploy**.
6. Tambahkan domain kustom di **Settings → Domains**.

---

## 17.3 Environment variables produksi

| Variable | Lingkungan | Contoh / catatan |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Semua | `https://mauskitchen.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Semua | `6281617691585` |
| `NEXT_PUBLIC_WHATSAPP_DISPLAY` | Semua | `0816-1769-1585` |
| `NEXT_PUBLIC_SUPABASE_URL` | Semua | dari dashboard Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Semua | dari dashboard Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server saja** | ⚠️ rahasia, jangan pakai prefix `NEXT_PUBLIC_` |
| `ADMIN_EMAILS` | **Server saja** | daftar email admin sah, dipisahkan koma |
| `RATE_LIMIT_SALT` | **Server saja** | string acak minimal 32 karakter |
| `ORDER_RETENTION_DAYS` | **Server saja** | 30–3650, ditetapkan pemilik |
| `NEXT_PUBLIC_ENABLE_QRIS` | Semua | wajib `true` untuk rilis produksi; preflight menolak nilai kosong/false |
| `NEXT_PUBLIC_ENABLE_TRANSFER` | Semua | `false` sampai rekening siap |
| `NEXT_PUBLIC_ENABLE_CASH` | Semua | `true` hanya bila tunai/COD diterima |
| `NEXT_PUBLIC_QRIS_IMAGE_PATH` | Semua | `/assets/payment/qris.jpeg` |
| `NEXT_PUBLIC_QRIS_MERCHANT_NAME` | Semua | `SATE TAICHAN HANNA` (harus cocok dengan layar pembayaran) |
| `NEXT_PUBLIC_BANK_NAME` | Semua | `BCA` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Semua | isi setelah dikonfirmasi pemilik |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Semua | isi setelah dikonfirmasi pemilik |

> Aturan: variabel dengan prefix `NEXT_PUBLIC_` **terlihat di browser**.
> Jangan pernah menaruh kunci rahasia di sana.

---

## 17.4 Domain produksi di Cloudflare Workers

| Opsi | Perkiraan biaya/tahun | Catatan |
|---|---|---|
| `.com` | Rp150.000 – Rp250.000 | Paling umum & dipercaya |
| `.id` | Rp200.000 – Rp300.000 | Butuh dokumen identitas |
| `.my.id` | Rp15.000 – Rp50.000 | Termurah, cocok untuk memulai |
| Subdomain Vercel | Gratis | `maus-kitchen.vercel.app` — cukup untuk uji coba |

Domain produksi memakai **Cloudflare Workers Custom Domain**, bukan record A
ke Vercel. Konfigurasi `wrangler.toml` memuat:

```toml
[[routes]]
pattern = "maukitchen.my.id"
custom_domain = true
```

Saat `npm run deploy` berhasil, Cloudflare membuat record DNS dan sertifikat
TLS untuk hostname tersebut secara otomatis. Jangan menambahkan record A atau
CNAME lain pada `maukitchen.my.id`, karena dapat bertabrakan dengan Custom
Domain. Hostname `www.maukitchen.my.id` belum digunakan; canonical produksi
adalah `https://maukitchen.my.id`.

---

## 17.5 Setup Supabase (Fase 2)

1. Buat project baru di [supabase.com](https://supabase.com) — region **Singapore** (terdekat dari Indonesia).
2. Buka **SQL Editor** → jalankan skema dari `docs/10_DATA_MODEL.md`.
3. Aktifkan **Row Level Security** dan jalankan policy yang tercantum di dokumen tersebut.
4. **Authentication → Providers** → aktifkan Email, matikan pendaftaran mandiri.
5. **Authentication → Users** → buat akun admin secara manual.
6. **Storage** → buat bucket `payment-proofs` (private, hard limit 1MiB,
   hanya `image/jpeg`, `image/png`, dan `image/webp`). Terapkan migration
   `20260824212500_limit_payment_proofs_to_one_mb.sql` pada project lama.
7. Salin `Project URL`, `anon key`, dan `service_role key` ke environment variables.
8. Terapkan `supabase/migrations/20260830000100_atomic_order_codes.sql` sebelum
   deploy aplikasi terbaru. Preflight akan menolak deploy bila tabel counter
   atomik belum tersedia. Migration menambah RPC v2 tanpa menghapus RPC v1,
   sehingga production lama tetap melayani checkout selama rollout.

### 17.5.1 Staging terisolasi

Staging memakai project Supabase `maus-kitchen-staging` (`srnmwvgbokmxjxdsplqu`)
dan Worker Cloudflare `maus-kitchen-staging`. Jangan memakai service-role key
production pada environment ini. Database staging boleh berisi data uji, tetapi
tidak boleh menjadi tempat uji migration destruktif tanpa backup.

Alasan environment terpisah:

- perubahan schema, RLS, Auth, Storage, dan checkout diuji tanpa menyentuh data pelanggan;
- desain UI dapat diuji terhadap backend nyata, bukan mock;
- health check menjadi gerbang sebelum perubahan dipromosikan ke `main`;
- domain, rate limiter, secret, dan project Supabase tidak berbagi binding dengan production.

Sebelum deploy pertama, buat GitHub environment `staging`, isi secret
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_SERVICE_ROLE_KEY`
khusus staging, `ADMIN_EMAILS`, `RATE_LIMIT_SALT`,
`NEXT_PUBLIC_BUSINESS_HOURS`, dan `NEXT_PUBLIC_BUSINESS_ADDRESS`. Secret
server-side yang sama juga harus dipasang pada Worker staging dengan:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging
npx wrangler secret put ADMIN_EMAILS --env staging
npx wrangler secret put RATE_LIMIT_SALT --env staging
```

Nilai operasional publik yang belum dikonfirmasi tidak disimpan sebagai `TBD`
di `wrangler.toml`, karena binding Wrangler dapat mengalahkan environment CI
saat OpenNext membangun bundle. Workflow memasok nilai final pada build dan
`security:preflight` menolak nilai kosong atau `TBD`.

Setelah semua nilai bisnis dikonfirmasi dan `/api/health` siap, set repository
variable GitHub Actions `STAGING_READY=true` (Settings → Secrets and variables →
Actions → Variables). Push ke `codex/staging` kemudian menjalankan quality gate
dan deploy staging. Secret tetap disimpan pada GitHub environment `staging`.
Promotion ke production tetap lewat merge terpisah ke `main`; jangan menunjuk
domain production ke Worker staging.

Catatan 2026-08-31: schema aktual project staging sudah disinkronkan tanpa
menghapus 20 pesanan uji. Riwayat migration project lama belum identik dengan
nama file lokal karena schema awal dibuat manual. Sebelum mengaktifkan
`supabase db push` otomatis, rekonsiliasi dengan perintah resmi
`supabase migration repair` menggunakan password database staging dan verifikasi
ulang dengan `supabase migration list`. CI staging saat ini sengaja tidak
menjalankan migration database otomatis.

---

## 17.6 Checklist sebelum go-live

### Teknis

- [ ] `npm run build` sukses secara lokal
- [ ] Semua environment variable sudah terisi di Vercel
- [ ] Domain kustom aktif dan HTTPS berjalan
- [ ] `robots.txt` dan `sitemap.xml` dapat diakses
- [ ] Halaman 404 kustom sudah dibuat
- [ ] Favicon dan apple-touch-icon terpasang
- [ ] Preview Open Graph diuji di WhatsApp & Instagram

### Konten & bisnis

- [ ] Semua harga diverifikasi pemilik usaha
- [ ] Gambar QRIS asli sudah diunggah
- [ ] Nomor rekening BCA sudah benar
- [ ] Jam operasional sudah final (bukan `TBD`)
- [ ] Alamat / area pengiriman sudah ditentukan
- [ ] Kebijakan ongkir sudah jelas
- [ ] Foto produk berkualitas baik terpasang

### Setelah rilis

- [ ] Lakukan satu pesanan uji dari HP asli, ujung ke ujung
- [ ] Pastikan pesan WhatsApp benar-benar masuk ke admin
- [ ] Daftarkan ke Google Search Console + kirim sitemap
- [ ] Buat Google Business Profile
- [ ] Pasang tautan di bio Instagram & WhatsApp Business
- [ ] Cetak QR code website untuk booth/kemasan
- [ ] Latih admin memakai dashboard (15 menit sudah cukup)

---

## 17.7 Pemeliharaan

| Kegiatan | Frekuensi |
|---|---|
| Cek pesanan yang menggantung di status `BARU` | Harian |
| Rekap penjualan | Harian |
| Cek harga masih sesuai | Bulanan |
| Update dependency (`npm outdated`) | Bulanan |
| Cadangkan database (ekspor Supabase) | Bulanan |
| Tinjau kecepatan situs (Lighthouse) | Triwulan |
| Perbarui foto produk | Sesuai kebutuhan |

---

## 17.8 Rencana pemulihan (rollback)

Jika deploy bermasalah:

1. Buka **Vercel → Deployments**.
2. Pilih deployment terakhir yang stabil.
3. Klik **⋯ → Promote to Production**.
4. Pemulihan berlangsung dalam hitungan detik tanpa perlu build ulang.

Jika database bermasalah, pulihkan dari backup harian Supabase
(*Point-in-time recovery* hanya tersedia pada paket berbayar — pada tier gratis,
lakukan ekspor manual berkala).

---

## 17.9 Perkiraan biaya

| Komponen | Tier gratis | Jika naik kelas |
|---|---|---|
| Vercel Hosting | Rp0 (Hobby) | ~$20/bulan (Pro) |
| Supabase | Rp0 (500MB DB) | ~$25/bulan |
| Domain | — | Rp15.000–Rp250.000/tahun |
| Payment gateway | — | ~0,7% per transaksi (Fase 3) |
| **Total awal** | **≈ Rp0 + domain** | — |

---

## 17.10 Deploy otomatis (GitHub Actions → Cloudflare Workers)

Target produksi saat ini adalah **Cloudflare Workers** via OpenNext
(`wrangler.toml`, `open-next.config.ts`).

| Workflow | Pemicu | Isi |
|---|---|---|
| `.github/workflows/deploy.yml` | push `main`, PR ke `main`, manual | job `quality` (typecheck, lint, test, build, `npm audit` high+) lalu job `deploy` (`npm run deploy` yang sudah mencakup preflight → health check) |
| `.github/workflows/data-retention.yml` | cron harian 18:00 UTC (01:00 WIB), manual | `npm run data:purge` agar `ORDER_RETENTION_DAYS` benar-benar diterapkan |

Catatan penting:

- Job `deploy` hanya jalan pada push/manual, **tidak** pada pull request; PR
  cukup melewati gerbang `quality`.
- `npm run deploy` dan `npm run upload` menjalankan security preflight
  sebagai bagian dari perintah rilis; jangan memanggil OpenNext/Wrangler
  langsung.
- Preflight produksi mewajibkan QRIS aktif dan aset QRIS tersedia. Perubahan
  secret `NEXT_PUBLIC_*` baru berlaku setelah workflow build/deploy dijalankan
  ulang karena nilainya di-inline ke bundle browser saat build.
- Env produksi didefinisikan di **level job** `deploy`, bukan per step. Alasan:
  `npm run deploy` menjalankan `opennextjs-cloudflare build` yang mem-build ulang
  Next.js, dan nilai `NEXT_PUBLIC_*` di-inline ke bundle browser pada build itu.
  Bila env hanya diberikan ke step build terpisah, artefak yang benar-benar
  ter-deploy berisi nilai kosong (login admin dan URL absolut rusak).
- `concurrency` mencegah dua deploy berjalan bersamaan.
- Setelah deploy, workflow memanggil `/api/health` (maksimum 6 percobaan, jeda
  10 detik). Endpoint hanya membalas `200` bila Supabase, allowlist admin, dan
  konfigurasi privasi siap — jadi rilis rusak langsung terlihat merah.
- Cloudflare Workers membagi request dan auto-scale di jaringan edge; load
  balancer aplikasi tambahan tidak diperlukan untuk 10–20 checkout serentak.
  Konsistensi burst dijaga counter kode atomik dan RPC transaksi Supabase.
- Aktifkan Workers Observability sebelum go-live agar error runtime, CPU, dan
  respons `5xx` dapat dilacak. Pantau pula limit harian paket Cloudflare dan
  kapasitas/kuota Supabase; keduanya batas layanan, bukan load balancer kode.

### Secrets repository yang wajib diisi

`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_WHATSAPP_NUMBER`,
`NEXT_PUBLIC_WHATSAPP_DISPLAY`, `NEXT_PUBLIC_ENABLE_QRIS`,
`NEXT_PUBLIC_ENABLE_TRANSFER`, `NEXT_PUBLIC_ENABLE_CASH`,
`NEXT_PUBLIC_QRIS_IMAGE_PATH`, `NEXT_PUBLIC_QRIS_MERCHANT_NAME`, `NEXT_PUBLIC_BANK_NAME`,
`NEXT_PUBLIC_BANK_ACCOUNT_NUMBER`, `NEXT_PUBLIC_BANK_ACCOUNT_NAME`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `RATE_LIMIT_SALT`,
`ORDER_RETENTION_DAYS`, `NEXT_PUBLIC_BUSINESS_HOURS`,
`NEXT_PUBLIC_BUSINESS_ADDRESS`, `NEXT_PUBLIC_INSTAGRAM_URL`.

Token Cloudflare cukup permission **Workers Scripts: Edit** (plus Workers R2 /
KV bila nanti dipakai). Simpan semuanya di *Settings → Secrets and variables →
Actions*; disarankan memakai environment `production` agar bisa diberi
*required reviewers*.

### Rollback

```bash
npx wrangler deployments list
npx wrangler rollback --message "rollback rilis bermasalah"
```

---

## 17.11 Railway dan Netlify

- Railway membaca `railway.json`, menjalankan `npm run build:production`, lalu
  `node .next/standalone/server.js`. Script postbuild menyalin aset public dan
  static yang diperlukan standalone.
- Netlify membaca `netlify.toml`; Route Handler tetap berjalan sebagai function.
- Keduanya menjalankan security preflight sebelum build. Deploy sengaja gagal
  bila signup terbuka, schema/bucket belum dimigrasi, atau env bisnis belum siap.
- Jadwalkan `npm run data:purge` setiap hari melalui Railway Cron atau scheduled
  job yang setara agar `ORDER_RETENTION_DAYS` benar-benar diterapkan.

Lihat checklist lengkap di `20_SECURITY_GO_LIVE.md`.

➡️ Lanjut ke `18_ROADMAP.md`
