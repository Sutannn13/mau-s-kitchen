# 17 — Deployment

## 17.1 Lingkungan

| Lingkungan | URL | Cabang Git | Tujuan |
|---|---|---|---|
| Development | `http://localhost:3000` | `feature/*` | Pengembangan lokal |
| Preview | `*.vercel.app` (otomatis) | Pull request | Review sebelum rilis |
| Production | `https://mauskitchen.com` (TBD) | `main` | Publik |

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
3. Build Command: `npm run build` · Output: `.next` (default).
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
| `NEXT_PUBLIC_QRIS_IMAGE_PATH` | Semua | `/assets/payment/qris.png` |
| `NEXT_PUBLIC_BANK_NAME` | Semua | `BCA` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Semua | isi setelah dikonfirmasi pemilik |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Semua | isi setelah dikonfirmasi pemilik |

> Aturan: variabel dengan prefix `NEXT_PUBLIC_` **terlihat di browser**.
> Jangan pernah menaruh kunci rahasia di sana.

---

## 17.4 Domain

| Opsi | Perkiraan biaya/tahun | Catatan |
|---|---|---|
| `.com` | Rp150.000 – Rp250.000 | Paling umum & dipercaya |
| `.id` | Rp200.000 – Rp300.000 | Butuh dokumen identitas |
| `.my.id` | Rp15.000 – Rp50.000 | Termurah, cocok untuk memulai |
| Subdomain Vercel | Gratis | `maus-kitchen.vercel.app` — cukup untuk uji coba |

Setelah domain dibeli, arahkan DNS ke Vercel:

```
Type   Name   Value
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

SSL/HTTPS dipasang otomatis oleh Vercel (Let's Encrypt).

---

## 17.5 Setup Supabase (Fase 2)

1. Buat project baru di [supabase.com](https://supabase.com) — region **Singapore** (terdekat dari Indonesia).
2. Buka **SQL Editor** → jalankan skema dari `docs/10_DATA_MODEL.md`.
3. Aktifkan **Row Level Security** dan jalankan policy yang tercantum di dokumen tersebut.
4. **Authentication → Providers** → aktifkan Email, matikan pendaftaran mandiri.
5. **Authentication → Users** → buat akun admin secara manual.
6. **Storage** → buat bucket `payment-proofs` (private).
7. Salin `Project URL`, `anon key`, dan `service_role key` ke environment variables.

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

➡️ Lanjut ke `18_ROADMAP.md`
