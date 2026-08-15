# TASK_BREAKDOWN.md

Breakdown pekerjaan menjadi task kecil yang bisa dikerjakan AI coding agent satu per satu.
Kerjakan **berurutan**. Jangan lompat sprint.

---

## Sprint 1 — Fondasi

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T1.1 | Inisialisasi Next.js 15 + TypeScript + Tailwind | Proyek jalan di `localhost:3000` | `npm run dev` tanpa error |
| T1.2 | Konfigurasi warna & font brand di Tailwind | `tailwind.config.ts`, `globals.css` | Token `gold`, `cream`, `ink` dll. bisa dipakai |
| T1.3 | Salin aset ke `public/assets/` | Logo & 3 poster menu | Gambar tampil di browser |
| T1.4 | Buat `data/menu.json` + tipe di `types/menu.ts` | Data menu terketik | `import menu` tanpa error tipe |
| T1.5 | Utilitas `formatRupiah`, `cn`, `lineSubtotal` | `lib/format.ts`, `lib/pricing.ts` | Unit test lolos |
| T1.6 | Layout dasar: Header, Footer, WhatsAppFab | `components/layout/*` | Tampil di semua halaman |
| T1.7 | Landing page sesuai `docs/08_UI_UX_SPEC.md` §8.2 | `app/page.tsx` | Hero + 3 kartu kategori + cara pesan |

**Status Sprint 1:** ✅ Selesai pada 15 Agustus 2026. Unit test, typecheck,
lint, production build, dan audit viewport 360px/768px/1440px lulus.

---

## Sprint 2 — Katalog Menu

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T2.1 | Komponen `MenuCard` | Kartu produk | Harga & badge tampil benar |
| T2.2 | Komponen `CategoryTabs` + `MenuGrid` | Navigasi kategori | Filter berfungsi |
| T2.3 | Halaman `/menu` | Semua kategori | 11 item tampil |
| T2.4 | Halaman `/menu/[kategori]` | Halaman per kategori | 3 rute statis terbentuk |
| T2.5 | Bottom sheet `ProductSheet` | Pilih varian & add-on | Total tombol update real-time |
| T2.6 | Halaman `/produk/[slug]` | Detail produk | SEO metadata per produk |
| T2.7 | Status "Habis" pada kartu | Kartu nonaktif | Tombol tambah tidak bisa diklik |

**Status Sprint 2:** ✅ Selesai pada 15 Agustus 2026. Unit test (15 kasus),
typecheck, lint, production build (3 rute kategori + 11 rute produk statis),
dan smoke test HTTP lulus (semua rute 200, slug tak dikenal 404, metadata
sesuai §15.2). QA visual 360/768/1280px menunggu verifikasi pemilik di browser.

---

## Sprint 3 — Keranjang

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T3.1 | Zustand store dengan `persist` | `lib/cart-store.ts` | Keranjang bertahan setelah refresh |
| T3.2 | Logika penggabungan baris (`lineId`) | Fungsi hash | Item identik digabung |
| T3.3 | Komponen `CartItemRow` + `QuantityStepper` | Baris keranjang | Ubah jumlah & hapus berfungsi |
| T3.4 | Komponen `CartSummary` | Ringkasan total | Sesuai kasus uji §16.5 |
| T3.5 | Halaman `/keranjang` | Halaman keranjang | Termasuk kondisi kosong |
| T3.6 | Badge jumlah di header | Indikator keranjang | Sinkron real-time |

**Status Sprint 3:** ✅ Selesai pada 15 Agustus 2026. Unit test (44 kasus),
typecheck, lint, production build, dan smoke test HTTP lulus. Keranjang
persist via Zustand (`mauskitchen-cart` v1), penggabungan baris via `lineId`,
badge header real-time, wiring `onAdd` dari sheet menu & detail produk.
Catatan: subtotal dihitung via `lib/pricing` di komponen, bukan method store.

---

## Sprint 4 — Checkout & Pembayaran

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T4.1 | Skema Zod `createOrderSchema` | `lib/validations.ts` | Unit test validasi lolos |
| T4.2 | Komponen `CheckoutForm` | Form + validasi | Semua aturan §8.5 terpenuhi |
| T4.3 | `PaymentMethodPicker` | Pilihan metode bayar | 3 opsi tampil |
| T4.4 | Generator kode pesanan | `lib/order-code.ts` | Format `MK-YYMMDD-XXX` |
| T4.5 | Builder pesan WhatsApp | `lib/whatsapp.ts` | Pesan sesuai template §13.2 |
| T4.6 | Route handler `POST /api/orders` | API pesanan | Harga dihitung ulang di server |
| T4.7 | Halaman `/pembayaran/[kode]` | Halaman QRIS | Nominal & tombol konfirmasi tampil |
| T4.8 | Halaman `/pesanan/[kode]` | Status pesanan | Linimasa status tampil |

**Status Sprint 4:** ✅ Selesai pada 15 Agustus 2026. Unit test + typecheck +
lint + build lulus. Smoke test HTTP: pesanan QRIS & tunai dibuat (201) dengan
total Rp118.000 sesuai §16.5, nomor WA invalid / keranjang kosong / item tak
dikenal → 400, permintaan ke-6 per menit → 429, halaman pembayaran/pesanan
tampil, kode tak dikenal → 404, GET detail tersamarkan (§11.4). Penyimpanan
pesanan Fase 1 = in-memory per proses (TODO T6.2 Supabase); urutan kode
pesanan memakai acak 1–999 sesuai docs/10 §10.6. Aset QRIS & rekening BCA
masih TBD — halaman pembayaran menampilkan placeholder tanpa mengarang data.

---

## Sprint 5 — Konten, SEO, Rilis

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T5.1 | Halaman `/tentang` | Cerita brand | Copy dari §15.4 |
| T5.2 | Halaman `/kontak` | Kontak & jam buka | Tombol WhatsApp berfungsi |
| T5.3 | Metadata + Open Graph + JSON-LD | SEO | Preview WhatsApp rapi |
| T5.4 | `sitemap.ts` + `robots.ts` | File SEO | Dapat diakses publik |
| T5.5 | Halaman 404 kustom | Error page | Ada tombol kembali ke menu |
| T5.6 | Optimasi gambar & performa | Aset ringan | Lighthouse ≥ 85 |
| T5.7 | QA menyeluruh sesuai §16.4 | Checklist terisi | Semua item lolos |
| T5.8 | Deploy ke Vercel | Situs live | Uji pesan dari HP asli |

**Status Sprint 5:** ✅ Selesai pada 16 Agustus 2026 (kecuali T5.8 = siap
deploy). T5.1–T5.6 selesai: halaman /tentang & /kontak (copy §15.4, jam/alamat
tetap TBD jujur), metadata OG lengkap + JSON-LD Restaurant (layout) & Menu +
MenuItem (/menu), sitemap.xml (18 URL) + robots.txt (blokir /admin & /api),
404 kustom, favicon/apple-icon/og-default.jpg (digenerate dari logo, 70KB),
format gambar AVIF/WebP. QA terautomasi: unit test 61 lulus, typecheck/lint/
build bersih, smoke HTTP 34 uji lulus, audit viewport 360/768/1280px di 10
halaman tanpa scroll horizontal. Lighthouse & uji HP fisik menunggu pemilik.
T5.8 deploy = langkah manual pemilik via `docs/19_SETUP_MANUAL.md`.

---

## Sprint 6 — Database & Admin (Fase 2)

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T6.1 | Setup Supabase + jalankan skema SQL | Database siap | Tabel & RLS aktif |
| T6.2 | Simpan pesanan saat checkout | Integrasi DB | Pesanan tercatat |
| T6.3 | Auth admin + middleware proteksi | Login admin | `/admin` terlindungi |
| T6.4 | Halaman `/admin/pesanan` | Daftar pesanan | Filter & aksi cepat berfungsi |
| T6.5 | Detail pesanan + ubah status | Manajemen pesanan | State machine dipatuhi |
| T6.6 | Halaman `/admin/menu` | Toggle ketersediaan | Perubahan tampil ≤ 60 detik |
| T6.7 | Halaman `/admin/rekap` | Rekap harian | Omzet & menu terlaris akurat |
| T6.8 | Unggah bukti pembayaran | Storage | File tersimpan & tampil di admin |

**Status Sprint 6:** ✅ Selesai pada 16 Agustus 2026 (kode lengkap; aktivasi
= setup manual pemilik). Skema `supabase/schema.sql` (tabel + index + trigger
+ RLS per docs/10 §10.3–10.4). Kode berjalan dua mode: tanpa env Supabase →
fallback in-memory Fase 1 (situs pelanggan tetap normal, admin menampilkan
panduan setup); dengan env → pesanan tersimpan ke Postgres (kode harian
count+1 per §10.6), auth admin Supabase Auth + middleware cookie refresh,
dashboard pesanan (statistik, filter, aksi cepat, auto-refresh 30 dtk,
paginasi), detail pesanan (aksi status sesuai state machine, ongkir dihitung
ulang server, catatan admin, chat WA pelanggan, bukti bayar signed URL),
kelola menu (toggle per item + massal, ISR 60 dtk + revalidatePath), rekap
(metrik, terlaris, per metode bayar, CSV BOM UTF-8), unggah bukti (JPG/PNG/
WebP maks 5MB, bucket private, rate-limited). API admin (GET /api/orders,
PATCH /api/orders/[kode], PATCH /api/menu/[itemId], GET /api/rekap)
terproteksi sesi + tervalidasi Zod; transisi status ilegal → 400.

---

## Sprint 6 — Database & Admin (Fase 2)

| ID | Task | Output | Selesai jika |
|---|---|---|---|
| T6.1 | Setup Supabase + jalankan skema SQL | Database siap | Tabel & RLS aktif |
| T6.2 | Simpan pesanan saat checkout | Integrasi DB | Pesanan tercatat |
| T6.3 | Auth admin + middleware proteksi | Login admin | `/admin` terlindungi |
| T6.4 | Halaman `/admin/pesanan` | Daftar pesanan | Filter & aksi cepat berfungsi |
| T6.5 | Detail pesanan + ubah status | Manajemen pesanan | State machine dipatuhi |
| T6.6 | Halaman `/admin/menu` | Toggle ketersediaan | Perubahan tampil ≤ 60 detik |
| T6.7 | Halaman `/admin/rekap` | Rekap harian | Omzet & menu terlaris akurat |
| T6.8 | Unggah bukti pembayaran | Storage | File tersimpan & tampil di admin |

---

## Aturan pengerjaan

1. Kerjakan **satu task** per percakapan agar konteks tetap fokus.
2. Sebelum mulai, baca ulang `.ai/CONTEXT.md`.
3. Setelah selesai, jalankan `npm run typecheck && npm run lint && npm run build`.
4. Laporkan hasil dalam format:
   ```
   ✅ Task T2.5 selesai
   File yang dibuat/diubah: ...
   Cara menguji: ...
   ASUMSI: ...
   ```
5. Jangan mengerjakan task sprint berikutnya sebelum diminta.
