# 07 — Information Architecture & Routing

## 7.1 Sitemap

```
/                          Landing page
├── /menu                   Katalog seluruh menu
│   ├── /menu/taichan       Kategori Taichan
│   ├── /menu/minuman       Kategori Minuman
│   └── /menu/chocoberry    Kategori ChocoBerry
├── /produk/[slug]          Detail produk
├── /keranjang              Keranjang belanja
├── /checkout               Form data pemesan
├── /pembayaran/[kode]      Instruksi pembayaran (QRIS / transfer)
├── /pesanan/[kode]         Status & ringkasan pesanan
├── /invoice/[kode]         Invoice privat siap cetak/PDF (token wajib)
├── /tentang                Cerita brand MAU'S Kitchen
├── /kontak                 Kontak, jam buka, lokasi
└── /admin                  Dashboard admin (terproteksi)
    ├── /admin/login        Halaman login
    ├── /admin/pesanan      Daftar & detail pesanan
    ├── /admin/menu         Kelola ketersediaan & harga menu
    └── /admin/rekap        Rekap penjualan harian
```

## 7.2 Tabel routing

| Route | Tipe render | Auth | Prioritas | Keterangan |
|---|---|---|---|---|
| `/` | Static | – | P0 | Hero, highlight, best seller, testimoni |
| `/menu` | Static | – | P0 | Semua kategori dengan anchor navigation |
| `/menu/[kategori]` | Static (generateStaticParams) | – | P0 | Filter per kategori |
| `/produk/[slug]` | Static | – | P1 | Detail + pemilihan varian/add-on inline + sticky CTA + rekomendasi "Lengkapi Pesananmu" |
| `/keranjang` | Client | – | P0 | Baca `localStorage` |
| `/checkout` | Client | – | P0 | Form + validasi |
| `/pembayaran/[kode]` | Dynamic | – | P0 | QRIS + nominal + tombol konfirmasi |
| `/pesanan/[kode]` | Dynamic | – | P1 | Lacak status pesanan |
| `/invoice/[kode]` | Dynamic | Token privat | P1 | Invoice sejak DIKONFIRMASI, siap cetak/PDF |
| `/tentang` | Static | – | P1 | Cerita brand |
| `/kontak` | Static | – | P1 | WhatsApp, jam buka, peta |
| `/admin/*` | Dynamic | ✅ | P1 | Dashboard admin |
| `/api/orders` | Route handler | – / ✅ | P1 | POST buat pesanan, GET daftar (admin) |
| `/api/orders/[kode]` | Route handler | – / ✅ | P1 | GET detail, PATCH ubah status (admin) |
| `/api/menu` | Route handler | – | P2 | GET menu + ketersediaan |

## 7.3 Navigasi

### Header (sticky)

```
[Logo MAU'S Kitchen]   Menu · Tentang · Kontak      [🛒 Keranjang (2)]
```

- Mobile: logo di kiri, ikon keranjang di kanan, menu hamburger.
- Header menempel di atas saat scroll, dengan latar `cream` + `backdrop-blur`.
- Badge jumlah item di ikon keranjang selalu sinkron dengan store.

### Bottom bar (khusus mobile)

```
[🏠 Beranda] [🍽️ Menu] [🛒 Keranjang] [💬 WhatsApp]
```

### Footer

```
Kolom 1: Logo + tagline "Homemade with Love" + deskripsi singkat
Kolom 2: Menu cepat (Taichan, Minuman, ChocoBerry)
Kolom 3: Kontak (WhatsApp 0816-1769-1585, Instagram, jam buka)
Kolom 4: Metode pembayaran (QRIS, DANA, BCA, GoPay, Tunai)
Baris bawah: © 2026 MAU'S Kitchen · Dibuat dengan ❤️
```

### Floating action button

- Tombol WhatsApp bulat di kanan bawah, muncul di semua halaman kecuali `/admin`.
- Pada mobile, posisikan di atas bottom bar agar tidak bertumpuk.

## 7.4 Hierarki konten landing page

```
1. Hero               → logo, tagline, CTA "Lihat Menu" + "Pesan via WhatsApp"
2. Status toko        → badge Buka/Tutup + jam operasional
3. Tiga lini produk   → 3 kartu besar: Taichan, Minuman, ChocoBerry
4. Best seller        → carousel 4–6 item paling laris
5. ChocoBerry showcase→ section gelap premium dengan foto besar
6. Kenapa MAU'S       → 3–4 poin nilai jual (homemade, bahan segar, sambal khas)
7. Cara pesan         → 4 langkah: Pilih → Keranjang → Checkout → Bayar
8. Metode pembayaran  → logo QRIS, DANA, BCA, GoPay
9. Testimoni          → 3 kartu ulasan (Fase 2)
10. CTA penutup       → "Lapar? Pesan sekarang" + tombol besar
11. Footer
```

## 7.5 Slug produk

| Produk | Slug |
|---|---|
| Taichan Daging | `taichan-daging` |
| Taichan Kulit | `taichan-kulit` |
| Lontong | `lontong` |
| Sambel Taichan | `sambel-taichan` |
| Teh Original | `teh-original` |
| Thai Tea | `thai-tea` |
| Teh Susu | `teh-susu` |
| Aren Latte | `aren-latte` |
| Choco Berry Original | `choco-berry-original` |
| Choco Berry Grape | `choco-berry-grape` |
| Choco Berry Banana | `choco-berry-banana` |

Slug = `id` di `data/menu.json`. Jangan buat mapping terpisah.

---

➡️ Lanjut ke `08_UI_UX_SPEC.md`
