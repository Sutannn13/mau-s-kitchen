# 19 — Panduan Setup Manual (untuk pemilik)

> Dokumen ini adalah **satu-satunya hal yang perlu kamu kerjakan manual** setelah
> semua kode selesai. Kerjakan berurutan dari atas. Estimasi total: ±60 menit.

---

## Prasyarat

- [ ] Akun GitHub gratis (github.com)
- [ ] Akun Vercel gratis (vercel.com — bisa login pakai akun GitHub)
- [ ] Akun Supabase gratis (supabase.com — bisa login pakai GitHub)
- [ ] (Opsional, nanti) domain sendiri

---

## Langkah 1 — Supabase (database + login admin + storage)

1. Buat project baru di <https://supabase.com/dashboard>.
   - Name: `maus-kitchen`
   - Region: **Singapore** (terdekat dari Indonesia)
   - Database password: simpan di tempat aman (tidak dipakai kode ini, hanya cadangan).
2. Tunggu provisioning selesai (±2 menit).
3. Buka **SQL Editor** → **New query** → tempel seluruh isi file
   `supabase/schema.sql` dari repo ini → **Run**.
   - Jika sukses akan muncul pesan `Success. No rows returned`.
4. **Authentication → Sign In / Providers → Email**: pastikan **Enable Email Provider** aktif.
5. **Authentication → Sign Up** (atau *Auth → Settings*): matikan
   **"Allow new users to sign up"** — agar tidak ada orang asing yang bisa buat akun admin.
6. **Authentication → Users → Add user → Create new user**:
   - Email: email admin (mis. `admin@mauskitchen.com` atau email pribadi)
   - Password: password kuat
   - Centang **Auto Confirm User**
7. **Storage → New bucket**:
   - Name: `payment-proofs` (harus persis)
   - Public bucket: **TIDAK** dicentang (private)
8. Salin 3 nilai dari **Project Settings → API**:
   - `Project URL` → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → untuk `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia, jangan pernah dibagikan)

### Uji cepat

Setelah Langkah 2 (env lokal) diisi, jalankan `npm run dev`, buka
`/admin` → seharusnya diarahkan ke `/admin/login`, login dengan akun dari poin 6,
dan dashboard pesanan tampil kosong.

---

## Langkah 2 — Environment variables lokal

Salin `.env.example` menjadi `.env.local` lalu isi:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=6281617691585
NEXT_PUBLIC_WHATSAPP_DISPLAY=0816-1769-1585

# Hasil Langkah 1 poin 8:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Pembayaran — masih TBD sampai pemilik konfirmasi:
NEXT_PUBLIC_QRIS_IMAGE_PATH=/assets/payment/qris.png
NEXT_PUBLIC_BANK_NAME=BCA
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=TBD
NEXT_PUBLIC_BANK_ACCOUNT_NAME=TBD
```

> Setelah env Supabase terisi, pesanan otomatis tersimpan ke database
> (bukan lagi memori server) dan dashboard admin aktif.

### Menaruh file QRIS asli

Upload gambar QRIS statis (resolusi tinggi) ke:
`public/assets/payment/qris.png` — halaman pembayaran otomatis menampilkannya.

---

## Langkah 3 — Git + GitHub

```powershell
git init
git add .
git commit -m "chore: initial commit aplikasi MAU'S Kitchen"
git branch -M main
git remote add origin https://github.com/<akun-kamu>/maus-kitchen-web.git
git push -u origin main
```

Buat repositori kosong `maus-kitchen-web` di GitHub dulu (tanpa README).

> `.env.local` sudah masuk `.gitignore` — tidak akan ikut ter-commit.

---

## Langkah 4 — Deploy ke Vercel

1. <https://vercel.com/new> → Import repository `maus-kitchen-web`.
2. Framework Preset: **Next.js** (terdeteksi otomatis). Biarkan default.
3. Buka **Environment Variables** dan masukkan SEMUA variabel dari Langkah 2
   (ganti `NEXT_PUBLIC_SITE_URL` dengan domain final, atau sementara
   `https://maus-kitchen.vercel.app`).
4. **Deploy** → tunggu ±2 menit.
5. (Opsional) **Settings → Domains** → tambahkan domain kustom:
   ```
   Type   Name   Value
   A      @      76.76.21.21
   CNAME  www    cname.vercel-dns.com
   ```
   SSL dipasang otomatis oleh Vercel.
   Setelah domain aktif, perbarui `NEXT_PUBLIC_SITE_URL` di Vercel lalu
   redeploy (Deployments → ⋯ → Redeploy).

---

## Langkah 5 — Verifikasi pasca-deploy

Lakukan dari **HP** dengan situs sudah live:

1. Buka `/menu` → tambah item ke keranjang → checkout sampai selesai.
2. Pastikan pesan WhatsApp otomatis terkirim ke admin (0816-1769-1585).
3. Buka `/admin` di HP → login → pesanan uji tampil di daftar.
4. Ubah status lewat tombol aksi → cek `/pesanan/[kode]` ikut berubah.
5. Buka `/admin/menu` → matikan satu item → tunggu ≤60 detik → item tampil
   "Habis" di `/menu` dan tidak bisa dipesan.
6. `/admin/rekap` → metrik + **Unduh CSV**.
7. `robots.txt` dan `sitemap.xml` bisa dibuka di browser.

---

## Ringkasan arsitektur pasca-setup

| Hal | Sebelum setup | Setelah setup |
|---|---|---|
| Penyimpanan pesanan | Memori server (hilang saat restart) | Supabase Postgres |
| Login admin | Tidak aktif (halaman panduan) | Supabase Auth email+password |
| Toggle "Habis" | Tidak aktif | `menu_overrides` + ISR 60 detik |
| Bukti bayar | WhatsApp saja | Upload ke Supabase Storage (maks 5MB) |
| Situs pelanggan | Berfungsi penuh | Berfungsi penuh (tidak berubah) |

---

## Setelah rilis (opsional tapi disarankan)

- Daftarkan **Google Search Console** → kirim `sitemap.xml`.
- Buat **Google Business Profile** (dampak SEO lokal terbesar untuk UMKM).
- Pasang tautan website di bio Instagram / WhatsApp Business.
- Cetak QR code menuju website untuk booth/kemasan.
- Latih admin memakai dashboard (±15 menit).

---

## Manajemen akun admin

- **Lupa password admin**: Supabase Dashboard → Authentication → Users →
  pilih user → **Send magic link / reset**, atau hapus dan buat ulang user.
- **Tambah admin kedua**: ulangi Langkah 1 poin 6.
- **Hentikan akses admin**: hapus user dari Authentication → Users.

---

➡️ Kembali ke `README.md` atau `docs/17_DEPLOYMENT.md` untuk detail teknis.
