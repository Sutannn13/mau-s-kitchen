# PROMPT_LIBRARY.md

Kumpulan prompt siap pakai per fitur. Salin, ganti bagian `<...>`, lalu kirim ke AI coding agent.
Semua prompt di sini mengasumsikan **master prompt di `.ai/AGENT_PROMPT.md` sudah dipasang lebih dulu**.

---

## P-01 — Inisialisasi proyek

```markdown
Buat fondasi proyek website MAU'S Kitchen.

Kerjakan:
1. Inisialisasi Next.js 15 (App Router, TypeScript, Tailwind, ESLint, src/, alias @/*)
2. Pasang dependency: zustand, react-hook-form, @hookform/resolvers, zod,
   framer-motion, lucide-react, clsx, tailwind-merge, sonner
3. Konfigurasi Tailwind dengan token warna brand:
   cream #F7EEE4, brown-deep #3E2318, gold #C79A4B, rose #E8AFA4,
   ink #0F0F0F, chili #D62828, flame #F4B01A, choco #2A1A12,
   berry #C0392B, pistachio #8A9A3B
4. Pasang font via next/font: Playfair Display, Bebas Neue, Plus Jakarta Sans
5. Buat utilitas: lib/utils.ts (cn), lib/format.ts (formatRupiah)
6. Buat struktur folder sesuai docs/09_TECH_STACK.md

formatRupiah harus menghasilkan tepat "Rp35.000" — tanpa spasi, tanpa ",00".
Jangan buat halaman apa pun dulu. Laporkan hasil, lalu tunggu instruksi berikutnya.
```

---

## P-02 — Data menu & tipe

```markdown
Buat sumber data menu untuk MAU'S Kitchen.

1. `src/types/menu.ts` — tipe MenuItem, MenuVariant, MenuAddOn, MenuCategory, MenuData
   (persis seperti docs/10_DATA_MODEL.md §10.1)
2. `src/data/menu.json` — isi dengan 11 item dari docs/05_MENU_CATALOG.md
3. `src/lib/menu.ts` — helper:
   - getAllItems()
   - getItemsByCategory(categoryId)
   - getItemBySlug(slug)
   - getCategories()
   - getBestSellers()
4. Unit test untuk memastikan seluruh harga sesuai katalog

PENTING:
- Pistacio Kunava (+8000) HANYA di item ChocoBerry
- Lemon Tea & Susu Strawberry masuk `archivedItems`, jangan di `items`
- Semua harga integer, tanpa titik/koma di JSON
```

---

## P-03 — Layout & landing page

```markdown
Buat layout dasar dan landing page MAU'S Kitchen.

Komponen layout:
- Header: logo, nav (Menu, Tentang, Kontak), ikon keranjang + badge jumlah
- Footer: logo, tagline, nav, WhatsApp 0816-1769-1585, jam buka (TBD), copyright
- WhatsAppFab: tombol mengambang kanan bawah
- BottomBar (mobile): Beranda · Menu · Keranjang · Chat

Landing page (app/page.tsx), urutan section:
1. Hero — latar cream, logo, headline, 2 CTA (Lihat Menu, Pesan via WhatsApp)
2. Tiga kartu kategori — Taichan (merah), Minuman (biru/gelap), ChocoBerry (coklat)
3. Best seller — carousel horizontal 4 produk
4. Kenapa MAU'S Kitchen — 4 poin dengan ikon
5. Cara pesan — 4 langkah bernomor
6. CTA penutup

Gunakan copywriting dari docs/15_SEO_CONTENT.md §15.4 apa adanya, jangan mengarang ulang.
Mobile-first, uji di lebar 360px.
```

---

## P-04 — Halaman menu & kartu produk

```markdown
Buat halaman katalog menu.

1. Komponen MenuCard:
   - Gambar 4:5, nama, deskripsi singkat (2 baris), harga ("mulai dari" jika ada varian)
   - Badge "Best Seller" bila berlaku
   - Tombol tambah (+) di pojok kanan bawah gambar
   - State habis: gambar grayscale, overlay "Habis", tombol nonaktif

2. CategoryTabs: tab sticky di bawah header (Semua, Taichan, Minuman, ChocoBerry)

3. Halaman /menu: semua kategori dengan judul section per kategori

4. Halaman /menu/[kategori]: generateStaticParams untuk taichan, minuman, chocoberry;
   metadata sesuai docs/15_SEO_CONTENT.md §15.2

Grid: 2 kolom di mobile, 3 di tablet, 4 di desktop.
Semua data dari lib/menu.ts. Dilarang hardcode harga.
```

---

## P-05 — Bottom sheet pemilihan produk

```markdown
Buat ProductSheet — bottom sheet untuk memilih varian, add-on, dan jumlah.

Isi:
- Gambar produk + nama + deskripsi
- Pilihan ukuran (radio card) bila item punya varian — tampilkan harga tiap ukuran
- Pilihan add-on (checkbox) bila item punya add-on — contoh: Pistacio Kunava +Rp8.000
- Input catatan (opsional, maks 120 karakter)
- Stepper jumlah (min 1, maks 50)
- Tombol sticky bawah: "Tambah ke Keranjang — Rp<total>"

Aturan:
- Total di tombol update real-time: (hargaVarian + Σ addOn) × jumlah
- Jika item punya varian, tombol nonaktif sampai ukuran dipilih
- Bisa ditutup dengan swipe ke bawah, tombol X, atau tombol Esc
- Gunakan role="dialog", aria-modal, dan focus trap
- Animasi slide-up dengan Framer Motion, durasi ≤ 250ms

Desktop: tampilkan sebagai dialog tengah, bukan bottom sheet.
```

---

## P-06 — Keranjang belanja

```markdown
Buat sistem keranjang belanja.

1. `lib/cart-store.ts` — Zustand + persist (key "mauskitchen-cart", version 1):
   items, addItem, removeItem, updateQuantity, clear, subtotal, totalItems

2. Logika lineId: hash dari itemId + variantId + addOnIds terurut + note.
   Item dengan lineId sama digabung (jumlahnya ditambah), bukan jadi baris baru.

3. Komponen: CartItemRow, QuantityStepper, CartSummary, EmptyCart

4. Halaman /keranjang:
   - Daftar item + tombol hapus (dengan undo lewat toast)
   - Ringkasan: subtotal, ongkir ("dikonfirmasi admin"), total
   - Tombol sticky: "Lanjut ke Checkout"
   - Kondisi kosong: ilustrasi + tombol "Lihat Menu"

5. Badge jumlah di header & bottom bar tersinkron otomatis

Wajib lolos kasus uji harga di docs/16_TESTING_QA.md §16.5.
Perhatikan hydration mismatch pada store yang dipersist — render badge setelah mounted.
```

---

## P-07 — Checkout & integrasi WhatsApp

```markdown
Buat alur checkout MAU'S Kitchen.

1. `lib/validations.ts` — skema Zod persis seperti docs/11_API_SPEC.md §11.2
   (termasuk normalisasi nomor 08xx → 62xx dan aturan alamat wajib untuk tipe Antar)

2. Halaman /checkout dengan React Hook Form:
   - Nama, WhatsApp, tipe pesanan (Antar / Ambil Sendiri)
   - Alamat + patokan (muncul hanya jika Antar)
   - Waktu (Secepatnya / Jadwalkan)
   - Catatan
   - Metode bayar: QRIS / Transfer BCA / Tunai
   - Ringkasan pesanan (bisa dilipat)
   - Tombol sticky: "Buat Pesanan — Rp<total>"
   - Redirect ke /menu bila keranjang kosong

3. `lib/order-code.ts` — generator kode MK-YYMMDD-XXX (zona Asia/Jakarta)

4. `lib/whatsapp.ts` — buildOrderMessage + buildWhatsAppUrl
   Format pesan PERSIS seperti docs/13_WHATSAPP_INTEGRATION.md §13.2.
   Gunakan *bold* satu bintang (format WhatsApp), bukan **bold**.

5. Setelah submit: buka WhatsApp di tab baru, kosongkan keranjang,
   arahkan ke /pembayaran/[kode].
   Gunakan pola "buka tab kosong dulu" (§13.4) agar tidak diblokir popup blocker.
```

---

## P-08 — Halaman pembayaran QRIS

```markdown
Buat halaman /pembayaran/[kode].

Tampilkan:
- Kode pesanan (besar, dengan tombol salin)
- Total yang harus dibayar (paling menonjol di halaman, dengan tombol salin nominal)
- Gambar QRIS dari NEXT_PUBLIC_QRIS_IMAGE_PATH
- Keterangan: "Bisa dibayar pakai DANA, GoPay, OVO, ShopeePay, atau m-banking apa pun"
- Instruksi pembayaran 4 langkah
- Hitung mundur batas bayar 60 menit
- Tombol utama: "Saya Sudah Bayar & Kirim Bukti" → WhatsApp dengan template konfirmasi
- Tombol sekunder: "Kirim Ulang Pesanan ke WhatsApp"

Varian tampilan:
- Metode Transfer → tampilkan nomor rekening BCA, bukan QRIS
- Metode Tunai → tampilkan "Siapkan Rp<total> saat pesanan datang", tanpa QRIS

Semua teks pembayaran mengikuti docs/12_PAYMENT_QRIS.md §12.6.
```

---

## P-09 — API pesanan

```markdown
Buat route handler POST /api/orders sesuai docs/11_API_SPEC.md.

Wajib:
1. Validasi body dengan createOrderSchema
2. HITUNG ULANG semua harga di server dari data/menu.json —
   JANGAN pernah memakai harga yang dikirim klien
3. Tolak item yang tidak ada atau sedang habis → 409 ITEM_UNAVAILABLE
4. Validasi bahwa add-on memang tersedia untuk item tersebut
   (Pistacio Kunava hanya untuk ChocoBerry) → 400 VALIDATION_ERROR
5. Buat kode pesanan MK-YYMMDD-XXX
6. Bangun pesan & URL WhatsApp
7. Kembalikan format sukses standar { success: true, data: {...} }
8. Rate limit 5 permintaan per IP per menit

Semua pesan error dalam Bahasa Indonesia yang ramah.
Sertakan unit test untuk skenario: sukses, item habis, add-on tidak sah, keranjang kosong.
```

---

## P-10 — Dashboard admin

```markdown
Buat dashboard admin sesuai docs/14_ADMIN_DASHBOARD.md.

1. Supabase Auth email+password + middleware proteksi /admin/*
2. /admin/login — form sederhana
3. /admin/pesanan — kartu ringkasan hari ini, filter, daftar pesanan,
   aksi cepat konfirmasi, auto-refresh 30 detik
4. Detail pesanan — data pemesan, item, input ongkir, ubah status, catatan admin,
   tombol chat WhatsApp
5. /admin/menu — toggle ketersediaan per item
6. /admin/rekap — rekap harian + menu terlaris + ekspor CSV

Aturan:
- Transisi status wajib mengikuti state machine docs/04_BUSINESS_FLOW.md;
  tombol untuk transisi tidak sah harus dinonaktifkan
- Optimalkan untuk penggunaan satu tangan di HP
- Aksi Batal butuh konfirmasi dua langkah
- Semua waktu ditampilkan dalam WIB
```

---

## P-11 — SEO & metadata

```markdown
Pasang SEO lengkap sesuai docs/15_SEO_CONTENT.md.

1. Metadata root + template judul "%s | MAU'S Kitchen"
2. generateMetadata untuk /menu, /menu/[kategori], /produk/[slug], /tentang, /kontak
3. Open Graph + Twitter Card (1200×630)
4. JSON-LD Restaurant di layout root
5. JSON-LD Menu + MenuItem di /menu
6. app/sitemap.ts dan app/robots.ts (blokir /admin dan /api)
7. Favicon + apple-touch-icon dari logo

Gunakan judul dan deskripsi persis dari tabel §15.2 — jangan menulis ulang.
```

---

## P-12 — Audit sebelum rilis

```markdown
Lakukan audit menyeluruh sebelum website MAU'S Kitchen dirilis.

Periksa dan laporkan temuan (jangan langsung memperbaiki tanpa izin):

1. HARGA — bandingkan seluruh harga di kode dengan docs/05_MENU_CATALOG.md
2. HARDCODE — cari angka harga atau nomor WhatsApp yang ditulis langsung di komponen
3. BAHASA — cari teks Inggris yang terlihat pelanggan
4. BRAND — cari penulisan "Maus Kitchen" yang salah
5. AKSESIBILITAS — gambar tanpa alt, input tanpa label, target sentuh < 44px
6. KEAMANAN — secret bocor ke klien, endpoint tanpa validasi server
7. RESPONSIF — elemen yang rusak di lebar 360px
8. SISA DEBUG — console.log, TODO, teks placeholder

Format laporan: tabel [Severity | File | Baris | Masalah | Saran perbaikan].
Urutkan dari severity tertinggi.
```

---

## P-13 — Menambah menu baru (untuk pemeliharaan)

```markdown
Tambahkan menu baru ke website MAU'S Kitchen.

Data menu baru:
- Nama: <nama>
- Kategori: <taichan | minuman | chocoberry>
- Harga: <harga>
- Varian: <ada/tidak, sebutkan>
- Deskripsi: <deskripsi>

Langkah:
1. Tambahkan entri ke src/data/menu.json (id kebab-case)
2. Tambahkan gambar ke public/assets/menu/
3. Perbarui tabel harga di docs/05_MENU_CATALOG.md
4. Naikkan `version` dan `updatedAt` di menu.json
5. Tambahkan baris di riwayat versi katalog

Jangan mengubah harga item lain.
```
