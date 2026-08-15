# 18 — Roadmap

## 18.1 Fase 1 — MVP "Katalog & Pesan" (target: 1–2 minggu)

**Tujuan:** website bisa dibagikan sebagai satu link, pelanggan bisa memesan tanpa bertanya harga.

| Sprint | Isi |
|---|---|
| Sprint 1 | Setup proyek, desain sistem (warna, font, komponen dasar), layout, landing page |
| Sprint 2 | Halaman menu, kartu produk, bottom sheet varian & add-on |
| Sprint 3 | Keranjang (Zustand + persist), halaman keranjang |
| Sprint 4 | Checkout, validasi, kode pesanan, integrasi WhatsApp, halaman pembayaran QRIS |
| Sprint 5 | Halaman tentang & kontak, SEO, QA, deploy |

**Kriteria selesai Fase 1**
- [ ] Semua 11 item menu tampil dengan harga benar
- [ ] Pesanan bisa diselesaikan sampai pesan WhatsApp terkirim
- [ ] Halaman QRIS tampil dengan nominal yang benar
- [ ] Lighthouse mobile ≥ 85
- [ ] Sudah live di domain dan diuji dari HP asli

---

## 18.2 Fase 2 — "Kelola Pesanan" (target: 2–3 minggu setelah Fase 1)

| Fitur | Nilai bisnis |
|---|---|
| Simpan pesanan ke database | Tidak ada pesanan yang hilang |
| Dashboard admin + login | Admin tidak perlu menggulir chat WhatsApp |
| Ubah status pesanan | Alur dapur jadi jelas |
| Rekap penjualan harian | Tahu omzet & menu terlaris |
| Toggle ketersediaan menu | Tidak ada komplain "kok habis?" |
| Unggah bukti pembayaran | Verifikasi lebih cepat |
| Halaman lacak pesanan | Mengurangi chat "pesanan saya sampai mana?" |

**Kriteria selesai Fase 2**
- [ ] Admin dapat mengelola seluruh pesanan dari HP
- [ ] Rekap harian akurat
- [ ] Menu habis otomatis tidak bisa dipesan

---

## 18.3 Fase 3 — "Otomatisasi & Pertumbuhan" (opsional, sesuai kebutuhan)

| Fitur | Prasyarat |
|---|---|
| QRIS dinamis otomatis via payment gateway | Volume pesanan tinggi & pemilik setuju biaya 0,7% |
| Notifikasi WhatsApp otomatis ke admin | Butuh WhatsApp Cloud API atau penyedia lokal |
| Ongkir otomatis berbasis jarak | Butuh data zona & tarif |
| Kupon / promo | Butuh strategi promosi dari pemilik |
| Testimoni & galeri pelanggan | Butuh ulasan terkumpul |
| Program loyalitas | Butuh basis pelanggan tetap |
| Pre-order & penjadwalan | Jika banyak pesanan acara |
| Multi-outlet | Jika membuka cabang |
| PWA (bisa dipasang di HP) | Setelah trafik stabil |

---

## 18.4 Daftar hal yang masih perlu dikonfirmasi pemilik

> Semua ini bertanda `TBD` di dokumentasi. Kumpulkan jawabannya sebelum go-live.

| No | Pertanyaan | Dibutuhkan untuk |
|---|---|---|
| 1 | Jam operasional resmi (hari & jam) | Status buka/tutup, halaman kontak |
| 2 | Alamat dapur / titik ambil pesanan | SEO lokal, opsi ambil sendiri |
| 3 | Area & tarif ongkir | Perhitungan total |
| 4 | Minimum order untuk pengiriman | Aturan checkout |
| 5 | Gambar QRIS statis resolusi tinggi | Halaman pembayaran |
| 6 | Nomor rekening BCA + nama pemilik | Opsi transfer |
| 7 | Apakah menerima COD? | Metode pembayaran |
| 8 | Akun Instagram / TikTok resmi | Footer & SEO |
| 9 | Apakah Lemon Tea & Susu Strawberry masih dijual + harganya | Katalog menu |
| 10 | Foto produk terpisah tanpa teks poster | Kualitas tampilan |
| 11 | Nama domain yang diinginkan | Deployment |
| 12 | Boleh pakai skema nominal unik 3 digit? | Rekonsiliasi pembayaran |

---

## 18.5 Ide pengembangan menu (catatan bisnis, bukan tugas developer)

- **Paket hemat** Taichan + minuman + lontong dengan harga bundel.
- **ChocoBerry Mix** — kombinasi strawberry, anggur, dan pisang dalam satu cup.
- **Level pedas** sambal taichan (1–5) sebagai pilihan di website.
- **Frozen taichan** siap bakar untuk dikirim ke luar kota.
- Topping tambahan ChocoBerry: keju, oreo, almond — memperbesar nilai transaksi.

> Semua ide di atas **wajib dikonfirmasi pemilik** sebelum dimasukkan ke `data/menu.json`.

---

## 18.6 Log keputusan

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-08-14 | Next.js + Tailwind + Supabase | Gratis, cepat, ramah AI coding agent |
| 2026-08-14 | WhatsApp deeplink, bukan API berbayar | Nol biaya, sesuai kebiasaan admin |
| 2026-08-14 | QRIS statis dulu, gateway belakangan | Hindari biaya per transaksi di awal |
| 2026-08-14 | Tanpa login pelanggan | Mengurangi hambatan pemesanan |
| 2026-08-14 | Lemon Tea & Susu Strawberry diarsipkan | Tidak ada di poster menu terbaru |

---

## 18.7 Status implementasi

| Tanggal | Sprint | Status | Ringkasan |
|---|---|---|---|
| 15 Agustus 2026 | Sprint 1 — Fondasi | **Selesai** | Next.js 15, token brand, font, aset publik, data menu terketik, utilitas uang, layout global, dan landing page responsif |
| 15 Agustus 2026 | Sprint 2 — Katalog Menu | **Selesai** | Halaman /menu + 3 kategori + 11 produk, MenuCard/CategoryTabs/MenuGrid, bottom sheet varian & add-on, status Habis, metadata SEO §15.2 |
| 15 Agustus 2026 | Sprint 3 — Keranjang | **Selesai** | Zustand persist, penggabungan lineId, halaman /keranjang, badge header real-time |
| 15 Agustus 2026 | Sprint 4 — Checkout & Pembayaran | **Selesai** | Zod + RHF, kode MK-YYMMDD-XXX, builder WA, POST /api/orders (harga dihitung ulang server), halaman /checkout, /pembayaran, /pesanan, rate limit 5/menit |
| 16 Agustus 2026 | Sprint 5 — Konten & SEO | **Selesai** | /tentang, /kontak, JSON-LD Restaurant+Menu, OG image, sitemap/robots, 404 kustom, favicon/apple-icon, AVIF/WebP; deploy = setup manual pemilik (docs/19) |
| 16 Agustus 2026 | Sprint 6 — Database & Admin | **Selesai** | supabase/schema.sql, integrasi DB dengan fallback in-memory, auth admin + middleware, /admin/pesanan + detail + menu + rekap, unggah bukti bayar |

Verifikasi Sprint 1:

- 11 unit test logika uang dan integritas menu lulus.
- TypeScript strict dan ESLint bersih.
- Production build Next.js 15 sukses.
- Viewport 360px, 768px, dan 1440px memiliki `scrollWidth` yang sesuai.
- Lighthouse mobile: Performance 91, Accessibility 96, Best Practices 96,
  SEO 100, dan LCP 2,45 detik.
- Aset publik teroptimasi menjadi 30–106KB per berkas; aset sumber tetap utuh.
- Jam operasional dan alamat tetap `TBD`; tidak ada data bisnis yang ditebak.

### Catatan pemeliharaan dependensi

Audit produksi pada 15 Agustus 2026 melaporkan tiga kerentanan tinggi dari
dependensi transitif Next.js (`postcss` dan `sharp`). Perintah perbaikan otomatis
meminta upgrade breaking ke Next.js 16, sehingga tidak dijalankan karena stack
proyek dikunci di Next.js 15. Audit wajib diulang sebelum deployment dan patch
kompatibel Next.js 15 perlu diterapkan saat tersedia.

---

🏁 **Akhir dokumentasi.** Kembali ke `.ai/AGENT_PROMPT.md` untuk mulai implementasi.
