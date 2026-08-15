# 08 — UI/UX Specification

Spesifikasi tiap halaman dan komponen. Semua ukuran mengacu pendekatan **mobile-first**.

---

## 8.1 Breakpoint

| Nama | Lebar | Kolom grid menu |
|---|---|---|
| `xs` | 360–479px | 1 |
| `sm` | 480–767px | 2 |
| `md` | 768–1023px | 2 |
| `lg` | 1024–1279px | 3 |
| `xl` | ≥1280px | 4 |

Lebar konten maksimum: `1200px`, padding horizontal `16px` (mobile) / `32px` (desktop).

---

## 8.2 Halaman: Landing (`/`)

### Hero

| Elemen | Spesifikasi |
|---|---|
| Latar | Gradien `cream` → `cream-soft`, ornamen floral tipis di sudut |
| Logo | 120px mobile / 160px desktop, di tengah |
| Judul | "Taichan Pedas, Minuman Segar, Dessert Coklat Premium" |
| Subjudul | "Homemade with Love — dibuat segar setiap hari" |
| CTA primer | "Lihat Menu" (tombol `gold`, teks `brown-deep`, `rounded-full`) |
| CTA sekunder | "Pesan via WhatsApp" (outline `brown`) |
| Badge | Status toko Buka/Tutup |

### Kartu tiga lini produk

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  🍢 TAICHAN  │  │  🧋 MINUMAN  │  │ 🍓 CHOCOBERRY│
│  mulai       │  │  mulai       │  │  mulai       │
│  Rp35.000    │  │  Rp10.000    │  │  Rp25.000    │
│  [Lihat >]   │  │  [Lihat >]   │  │  [Lihat >]   │
└─────────────┘  └─────────────┘  └─────────────┘
```

- Mobile: tumpuk vertikal; Desktop: 3 kolom sejajar.
- Hover: naik 4px + bayangan menguat.

### Section "Cara Pesan"

4 langkah bernomor dengan ikon: **Pilih Menu → Masuk Keranjang → Isi Data → Bayar & Konfirmasi**.

---

## 8.3 Halaman: Menu (`/menu`)

### Tab kategori (sticky di bawah header)

```
[ Semua ] [ Taichan ] [ Minuman ] [ ChocoBerry ]
```

Tab aktif: latar `gold`, teks `brown-deep`. Scroll horizontal di mobile.

### Kartu menu (`MenuCard`)

```
┌─────────────────────────┐
│   [Foto produk 4:5]      │  ← next/image, lazy load
│   🏆 Best Seller          │  ← badge opsional (kanan atas)
├─────────────────────────┤
│ Taichan Daging           │  ← H3, 17px, 600
│ Sate ayam dibakar tanpa  │  ← deskripsi, 2 baris, ellipsis
│ bumbu kacang...          │
│                          │
│ Rp35.000      [ + Tambah]│  ← harga gold, tombol pill
└─────────────────────────┘
```

Varian kartu:

| Kondisi | Tampilan |
|---|---|
| Punya varian ukuran | Harga tampil `Rp25.000 – Rp35.000`, tombol membuka bottom sheet |
| Punya add-on | Ikon ➕ kecil di samping harga |
| `available: false` | Foto grayscale, overlay "Habis", tombol nonaktif |
| Item tambahan (lontong/sambel) | Kartu ringkas tanpa foto besar |

### Bottom sheet pemilihan varian

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Choco Berry Grape
 Strawberry & anggur segar...

 Pilih Ukuran *
  ○ Small     Rp30.000
  ◉ Medium    Rp40.000

 Tambahan
  ☑ Pistacio Kunava   +Rp8.000

 Catatan (opsional)
  [ ................................ ]

 Jumlah:  [ − ]  2  [ + ]

 [ Tambah ke Keranjang — Rp96.000 ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Aturan:
- Tombol nonaktif sampai varian wajib dipilih.
- Total pada tombol diperbarui real-time.
- Setelah ditambahkan, tampilkan toast "Ditambahkan ke keranjang ✓".

---

## 8.4 Halaman: Keranjang (`/keranjang`)

```
Keranjang Kamu (3 item)

┌───────────────────────────────────┐
│ [img] Taichan Daging                 │
│       Rp35.000                       │
│       [−] 2 [+]        Rp70.000  🗑️  │
├───────────────────────────────────┤
│ [img] Choco Berry Grape (Medium)     │
│       + Pistacio Kunava              │
│       Rp48.000                       │
│       [−] 1 [+]        Rp48.000  🗑️  │
└───────────────────────────────────┘

 Subtotal                     Rp118.000
 Ongkir            dikonfirmasi admin
 ──────────────────────────────────
 TOTAL                        Rp118.000

 [ Lanjut ke Checkout ]
 [ + Tambah Menu Lain ]
```

- Mengurangi jumlah dari 1 → tampilkan konfirmasi hapus.
- Ada tombol "Kosongkan keranjang" (dengan konfirmasi).
- Keranjang kosong: ilustrasi + teks ramah + tombol "Lihat Menu".
- Desktop: ringkasan menempel (sticky) di kolom kanan.

---

## 8.5 Halaman: Checkout (`/checkout`)

### Field form

| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| Nama Lengkap | text | ✅ | min 2 karakter |
| Nomor WhatsApp | tel | ✅ | regex `^(\+?62|0)8[1-9][0-9]{6,11}$` |
| Tipe Pesanan | radio | ✅ | `Antar` \| `Ambil Sendiri` |
| Alamat Lengkap | textarea | Kondisional | wajib jika `Antar`, min 10 karakter |
| Patokan / Catatan Alamat | text | – | – |
| Waktu Pesanan | radio | ✅ | `Secepatnya` \| `Jadwalkan` (+ input waktu) |
| Catatan Pesanan | textarea | – | maks 200 karakter |
| Metode Pembayaran | radio card | ✅ | `QRIS` \| `Transfer` \| `Tunai/COD` |

### Kartu metode pembayaran

```
◉ QRIS  — DANA / GoPay / OVO / ShopeePay / m-banking
○ Transfer Bank — BCA
○ Tunai / COD — bayar saat pesanan diterima
```

### Perilaku

- Simpan draft form ke `sessionStorage` agar tidak hilang saat refresh.
- Ringkasan pesanan tetap terlihat (accordion di mobile, sticky di desktop).
- Tombol submit: `Buat Pesanan — Rp118.000`, nonaktif saat loading + spinner.
- Setelah sukses: redirect ke `/pembayaran/[kode]` **dan** buka WhatsApp di tab baru.

---

## 8.6 Halaman: Pembayaran (`/pembayaran/[kode]`)

```
✅ Pesanan Diterima
Kode Pesanan: MK-260814-001

Total yang harus dibayar
Rp118.000                    [Salin nominal]

┌──────────────────────┐
│   [ GAMBAR QRIS ]      │   ← minimal 260×260px
│   MAU'S Kitchen        │
└──────────────────────┘
Bisa dibayar dari DANA, GoPay, OVO, ShopeePay,
LinkAja, dan semua m-banking.

Langkah pembayaran:
1. Buka aplikasi e-wallet / m-banking kamu
2. Pilih menu Scan QRIS
3. Pindai kode di atas
4. Masukkan nominal Rp118.000
5. Selesaikan pembayaran & simpan bukti

[ ✅ Saya Sudah Bayar & Kirim Bukti ]  ← buka WhatsApp
[ Kirim Ulang Pesanan ke WhatsApp ]
```

- Jika metode = Transfer: tampilkan nomor rekening BCA + tombol salin.
- Jika metode = Tunai/COD: lewati halaman ini, langsung ke `/pesanan/[kode]`.
- Tampilkan pengingat: "Pesanan diproses setelah pembayaran dikonfirmasi admin."

---

## 8.7 Komponen yang harus dibuat

| Komponen | Lokasi | Keterangan |
|---|---|---|
| `Header` | `components/layout/` | Sticky + badge keranjang |
| `Footer` | `components/layout/` | 4 kolom |
| `MobileBottomBar` | `components/layout/` | Navigasi bawah mobile |
| `WhatsAppFab` | `components/layout/` | Tombol mengambang |
| `StoreStatusBadge` | `components/common/` | Buka/Tutup |
| `MenuCard` | `components/menu/` | Kartu produk |
| `MenuGrid` | `components/menu/` | Grid responsif |
| `CategoryTabs` | `components/menu/` | Tab kategori |
| `ProductSheet` | `components/menu/` | Bottom sheet varian |
| `QuantityStepper` | `components/common/` | Tombol −/+ |
| `CartItemRow` | `components/cart/` | Baris item keranjang |
| `CartSummary` | `components/cart/` | Ringkasan total |
| `CheckoutForm` | `components/checkout/` | Form + validasi |
| `PaymentMethodPicker` | `components/checkout/` | Kartu metode bayar |
| `QrisPanel` | `components/payment/` | Tampilan QRIS |
| `OrderStatusTimeline` | `components/order/` | Linimasa status |
| `EmptyState` | `components/common/` | Kondisi kosong |
| `Price` | `components/common/` | Format rupiah konsisten |
| `Toast` | `components/common/` | Notifikasi singkat |

---

## 8.8 Aksesibilitas

- Semua gambar wajib punya `alt` deskriptif Bahasa Indonesia.
- Target sentuh minimal `44×44px`.
- Fokus keyboard terlihat jelas (`focus-visible:ring-2 ring-gold`).
- Form: setiap input punya `<label>` yang terhubung, error pakai `aria-describedby`.
- Bottom sheet & modal: `role="dialog"`, focus trap, tutup dengan `Esc`.
- Jangan hanya mengandalkan warna untuk menandai status (tambahkan ikon/teks).

---

## 8.9 Kondisi loading, kosong, dan error

| Kondisi | Tampilan |
|---|---|
| Loading menu | Skeleton kartu (bukan spinner penuh layar) |
| Keranjang kosong | Ilustrasi + "Keranjang kamu masih kosong. Yuk pilih menu favoritmu!" |
| Menu habis semua | "Menu sedang kosong, cek lagi nanti ya 🙏" |
| Toko tutup | Banner atas + checkout jadi mode pre-order |
| Gagal submit | Toast merah + tombol "Coba Lagi", keranjang tetap aman |
| Halaman tidak ada (404) | Ilustrasi + tombol kembali ke Menu |

---

➡️ Lanjut ke `09_TECH_STACK.md`
