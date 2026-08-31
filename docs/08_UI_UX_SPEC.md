# 08 — UI/UX Specification

Spesifikasi tiap halaman dan komponen. Semua ukuran mengacu pendekatan **mobile-first**.

---

## 8.1 Breakpoint

| Nama | Lebar | Kolom grid menu |
|---|---|---|
| `xs` | 360–479px | 2 |
| `sm` | 480–767px | 2 |
| `md` | 768–1023px | 2 |
| `lg` | 1024–1279px | 3 |
| `xl` | ≥1280px | 4 |

Lebar konten maksimum: `1200px`, padding horizontal `16px` (mobile) / `32px` (desktop).

### Sistem primitif & tangga z-index (upgrade Batch 1, 2026-08)

Lapisan primitif dalam-repo `src/components/ui/` menyatukan komponen token-driven: `Button`, `IconButton`, `Input`, `Textarea`, `Label`, `Badge`, `Card`, `Skeleton`, `Divider`, dan `Dialog`. FAQ publik memakai native `<details>` agar keyboard-accessible tanpa JavaScript. Hook `useDialogA11y` diekstrak dari a11y `ProductSheet` (focus-trap, Esc, restore fokus, scroll-lock). Motion dipertahankan untuk area admin dan interaksi kompleks yang dimuat setelah aksi pengguna; halaman publik awal memakai CSS/native interaction agar main-thread HP tetap ringan.

Tangga z-index terpadu (token Tailwind, sumber nilai CSS var di `globals.css`):

| Token | Nilai | Penggunaan |
|---|---|---|
| `z-base` | 0 | konten normal |
| `z-dropdown` | 30 | menu dropdown (Header seluler) |
| `z-fab` | 40 | `WhatsAppFab` (diangkat `bottom-20` pada seluler agar di atas `MobileBottomBar`) |
| `z-sticky` | 50 | `Header` sticky, `MobileBottomBar`, sticky CTA checkout |
| `z-toast` | 60 | `Toast` (di bawah dialog agar notifikasi tak menutupi modal) |
| `z-dialog` | 70 | `ProductSheet` dan `Dialog` (modal teratas) |

Token permukaan semantik: `bg-surface` / `bg-surface-strong` / `bg-surface-ink(-soft)` / `bg-surface-choco` / `bg-page` menggantikan hex ad-hoc. Keyframe `reveal` (fade+8px up, 350ms, sekali) ditambah untuk entrance seksi; jaring pengaman `prefers-reduced-motion` di `globals.css` menghentikan animasi yang lolos dari `motion-reduce:animate-none`.

Keyframe aksen tambahan (Batch 6): `animate-halo` (denyut ambient 2,6s pada langkah timeline aktif — satu-satunya loop di rute pelanggan) dan `animate-sheen` (kilau emas sekali jalan pada panel TOTAL). Kelas `.rail-fill` di `globals.css` memegang animasi isian rail timeline karena sumbunya berganti (`scaleY` seluler → `scaleX` ≥480px) dan Tailwind tidak bisa menukar nama keyframes lintas breakpoint.

### Panel admin — upgrade Batch 5 (2026-08)

- `MenuItemEditor` memakai `Dialog` bersama (role=dialog, aria-modal, focus-trap, Esc, pemulihan fokus, scroll-lock) — a11y identik dengan `ProductSheet`.
- Drawer seluler `AdminSidebar` kini dialog sungguhan (fokus masuk/trap/pulih) + `motion-reduce:animate-none` pada `animate-drawer-in`.
- `StatusBadge` memakai token brand (BARU=flame, DIKONFIRMASI=info, DIPROSES=gold, DIKIRIM=brown, SELESAI=success, BATAL=chili) dengan ikon per status — bukan warna-saja; string status/logika server tidak berubah.
- Warna chart dashboard terpusat di `components/admin/dashboard/palette.ts` (`chartPalette` + `paymentMethodColors`).
- `AutoRefresh` menampilkan stempel "terakhir diperbarui" (WIB) + soft-fail `role=alert` bila refresh gagal; timestamp sengaja bukan live-region agar tidak berisik bagi pembaca layar.
- Detail pesanan admin menampilkan `OrderStatusTimeline` (komponen sama dengan sisi pelanggan).
- `MenuManager`: aksi destruktif (Tandai Semua Habis, Arsip) memakai `ConfirmButton` dua langkah inline; Pulihkan tetap langsung.

---

## 8.2 Halaman: Landing (`/`)

### Hero

| Elemen | Spesifikasi |
|---|---|
| Latar | `cream` dengan panel `cream-soft`, border coklat tipis, dan frame emas offset |
| Foto focal | Foto sajian resmi — split editorial di desktop, stacked di seluler; `priority` LCP. Parallax hanya menggerakkan layer foto di dalam frame sehingga layout tidak bergeser |
| Judul | "Manisnya Bikin Senyum. Pedasnya Bikin Nagih." dengan reveal kata-per-kata singkat tanpa blur |
| Subjudul | Ringkasan lini ChocoBerry dan Sate Taichan, tanpa klaim harga/waktu operasional baru |
| CTA primer | "Pesan Sekarang" menuju katalog ringkas dalam halaman |
| CTA sekunder | "Jelajahi Menu" menuju `/menu` |
| Badge | `StoreStatusBadge` (ikon+teks Buka/Tutup/konfirmasi-WA, dihitung klien via `useSyncExternalStore` dari `lib/store-hours.ts`; TBD → teks konfirmasi, tidak mengarang status) |
| Entrance | Hero memakai entrance CSS transform-only; paragraf LCP tetap statis dan terlihat sejak frame pertama. Section below-the-fold memakai scroll-driven CSS reveal. Tidak ada observer/parallax JS; seluruh motion tunduk pada `prefers-reduced-motion` |

### Statistik dan nilai brand

- Strip statistik mengambil jumlah menu, kategori, best seller, dan metode
  pembayaran aktif dari data/config hidup. Angka tidak ditulis manual.
- Section nilai brand memakai empat foto resmi secara crossfade opacity 20s,
  overlay gelap, dan kartu `backdrop-blur`. Hanya satu gambar tampil pada waktu
  tertentu; initial state deterministik untuk mencegah tumpukan gambar.

### Katalog ringkas pada landing (upgrade 2026-08-30)

Tiga blok katalog lama yang berulang (kategori, best seller, dan menu pilihan)
disatukan menjadi satu katalog ringkas yang tetap membaca data hidup dari
`getCachedMenu()`.

- Seluler 360px: search field, rail kategori horizontal bergambar, lalu kartu
  menu dua kolom seperti aplikasi pemesanan. Nama, harga, status Favorit/Habis,
  dan tombol tambah tetap terlihat tanpa membuka halaman lain.
- Desktop: kontrol kategori membungkus ke baris dan kartu menjadi tiga kolom;
  komposisi tetap editorial, bukan layar aplikasi seluler yang diperbesar.
- Produk tanpa varian ditambahkan langsung. Produk dengan varian/add-on membuka
  `ProductSheet` yang sama dengan halaman `/menu`.
- Animasi masuk memakai `card-enter`; hover hanya transform dan shadow. Semua
  motion tunduk pada `prefers-reduced-motion`.
- Homepage tidak menggandakan harga atau data menu. Poster kategori tetap
  fallback; foto produk khusus dipakai hanya bila aset resmi sudah tersedia.

### Section "Cara Pesan"

4 langkah bernomor dengan ikon: **Pilih Menu → Masuk Keranjang → Isi Data → Bayar & Konfirmasi**.

### FAQ dan CTA akhir

- FAQ memakai native `<details>/<summary>`, dapat dioperasikan dengan keyboard tanpa hydration,
  dan copy mengikuti kontrak bisnis: ongkir ditetapkan admin, waktu siap
  bergantung menu/antrean, serta pembatalan pelanggan hanya sebelum Diproses.
- CTA akhir memakai `MotionBorder` dan efek magnetik pointer yang dinonaktifkan
  saat reduced motion. Semua link tetap anchor semantik dan dapat difokuskan.

---

## 8.3 Halaman: Menu (`/menu`)

### Tab kategori (sticky di bawah header)

```
[ Semua ] [ Taichan ] [ Minuman ] [ ChocoBerry ]
```

Tab aktif: latar `gold`, teks `brown-deep`. Scroll horizontal di mobile.

Semua tab memakai rute penuh: klik `Taichan`/`Minuman`/`ChocoBerry` pindah ke
halaman kategori `/menu/{kategori}` (chip aktif ter-highlight di sana), klik
`Semua` kembali ke `/menu`. (Diubah dari perilaku lama scroll-hash pada
`/menu` — permintaan pemilik, 2026-08-22.)

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
| Item tambahan (lontong/sambel) | Kartu penuh dengan foto & link detail, sama seperti menu utama (diubah dari kartu ringkas — permintaan pemilik, 2026-08-22) |

Upgrade mobile 2026-08-30: `/menu` memakai dua kolom sejak 360px, gambar
persegi, nama maksimal dua baris, deskripsi disembunyikan pada lebar di bawah
480px, dan tombol tambah menjadi tombol ikon 44px. Pada ≥480px kartu kembali
menampilkan deskripsi dan label tombol lengkap. Pola ini menyamai katalog
ringkas di landing tanpa mengubah `ProductSheet` atau data menu.

Landing memakai `MotionBorder` lokal berbasis `motion/react` pada CTA penutup.
Komponen mengikuti pola visual Motion/Magic UI, tetapi tidak menambah dependency
baru; animasi conic-border berhenti total saat `prefers-reduced-motion` aktif.

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

- Penghapusan item memakai tombol sampah dengan konfirmasi dua langkah inline (`ConfirmButton` — "Ya, Hapus" + "Batal", pola sama dengan admin; menggantikan `window.confirm` yang memblokir, upgrade Batch 3). Tombol − nonaktif di jumlah 1.
- Ada tombol "Kosongkan keranjang" (konfirmasi dua langkah inline).
- Keranjang kosong: `EmptyState` (ikon + teks ramah + tombol "Lihat Menu").
- Loading (sebelum rehydrate): `Skeleton` baris keranjang.
- Desktop: ringkasan menempel (sticky) di kolom kanan.

---

## 8.5 Halaman: Checkout (`/checkout`)

Upgrade Batch 3: field memakai primitif `Input`/`Textarea`/`Label` (ring fokus-gold konsisten, error border-chili + `aria-describedby`); persetujuan privasi tampil SEBELUM tombol kirim; tombol "Buat Pesanan" menjadi CTA sticky di atas `MobileBottomBar` pada seluler (z-sticky 50 menutup FAB z-fab 40 sesuai tangga z-index; desktop inline statis).

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
- Setelah sukses: redirect ke `/pembayaran/[kode]` tanpa membuka tab atau aplikasi WhatsApp.

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

[ ⬆ Unggah Bukti Bayar ]  ← tombol utama
  JPG/PNG/WebP, pilih maks 4MB; otomatis disimpan maks 1MB
      ↓ unggah berhasil (animasi fade + slide)
[ ✅ Saya Sudah Bayar & Kirim Bukti ]  ← buka WhatsApp
[ Kirim Ulang Pesanan ke WhatsApp ]
```

- Tombol utama **tunggal**: selama bukti belum terunggah tampil "Unggah Bukti
  Bayar"; begitu unggah sukses tombol itu sendiri beranimasi berganti menjadi
  "Saya Sudah Bayar & Kirim Bukti" (`PaymentProofActions.tsx`). Unggah gagal →
  tombol tetap di mode unggah agar pelanggan bisa coba lagi.
- Bila unggah tidak tersedia (metode tunai, bukti sudah ada, atau Supabase
  Storage belum dikonfigurasi), tombol konfirmasi WhatsApp langsung tampil.

- Jika metode = Transfer: tampilkan nomor rekening BCA + tombol salin.
- Jika metode = Tunai/COD: lewati halaman ini, langsung ke `/pesanan/[kode]`.
- Tampilkan pengingat: "Pesanan diproses setelah pembayaran dikonfirmasi admin."

### Riwayat Pesanan (`/pesanan`) — hardening akses (2026-08-31)

- Pencarian menerima kode yang tersimpan di riwayat perangkat atau tautan privat lengkap. Kode asing tanpa token tidak dinavigasikan ke halaman 404 dan mendapat error inline yang terhubung ke input melalui `aria-describedby`.
- Input memiliki label aksesibel, petunjuk format, batas panjang 512 karakter, dan status `aria-invalid` saat gagal.
- Kartu memakai label status resmi dan timeline empat tahap `Diterima → Diproses → Dikirim → Selesai`; `DIKONFIRMASI` diringkas ke tahap `Diterima`, sedangkan `BATAL` tidak menampilkan timeline.
- Riwayat hanya menyediakan CTA **Lihat Status & Rincian**. CTA pembayaran dimiliki halaman rincian/pembayaran karena kesiapan rencana pengantaran dan klaim pembayaran harus divalidasi dari data server, bukan snapshot lokal.

### Status Pesanan (`/pesanan/[kode]?token=…`) — redesign "Struk & Tiket Dapur" Batch 7 (2026-08-22)

Halaman ini adalah satu-satunya "akun" pelanggan (tanpa login, akses via token). Karena dipakai berulang selagi menunggu, hierarkinya dibalik: identitas pesanan dulu, lalu progres, baru rincian.

Prinsip Batch 7: satu artefak utuh bernuansa struk dapur (bukan tumpukan kartu melayang), identitas dari tipografi mono/serif dan material kertas — tanpa gradien dekoratif, glow blur, atau kilau sheen (elemen "AI slop" Batch 6 dihapus).

| Blok | Spesifikasi |
|---|---|
| Stub tiket | Kartu gelap **solid** `ink-soft` `rounded-t-[1.75rem]` (satu-satunya permukaan gelap di rute pelanggan). Eyebrow "MAU'S KITCHEN · KODE PESANAN", kode `font-mono` ukuran display, `OrderStatusPill`, meta tanggal + "Tanpa login · tautan privat" dalam satu baris. Tombol Salin kode + mikroteks penjelas fungsinya ("untuk ditunjukkan ke admin saat menanyakan pesanan"). Strip "apa berikutnya" (`nextStepHints`) dengan border emas tipis. |
| Perforasi tiket | Garis dashed `cream/20` di dasar stub + dua notch lingkaran 20px berwarna latar halaman yang "menggigit" tepi badan struk (`--surface-page`) — kesan tiket disobek. |
| Badan struk | Kartu krem (`--surface`) menerus dari stub, `border-x gold/20`, tanpa radius bawah. Berisi timeline → pemisah dashed → rincian. |
| Rincian struk | Baris item: badge jumlah `font-mono`, nama + varian, harga per porsi `font-mono` tabular, catatan italic beraksen garis kiri, total per baris dari `lineSubtotal()`. Baris Subtotal/Ongkir memakai **leader titik-titik** ala struk fisik (`.DottedRow` di `OrderReceiptDetails`). |
| Panel TOTAL | Garis ganda `border-double gold/45` + angka serif Playfair besar — hirarki tipografis, tanpa panel gradien/sheen. |
| Tepi sobek | `.receipt-tear` di `globals.css`: gigi segitiga 7×9px dari dua gradien diagonal, celah transparan memperlihatkan latar halaman. |
| `OrderStatusPill` | `components/order/` — versi terang dari `StatusBadge` admin; kontras dihitung terhadap latar gelap. Selalu ikon + teks. |
| Timeline | Vertikal pada seluler, horizontal ≥480px. Dot 36px: tercapai = gradien `gold-light → gold` + glow, saat ini = tambah halo denyut (`animate-halo`), belum = `bg-cream` + border. Ikon per langkah (CircleDot/BadgeCheck/ChefHat/Truck/PartyPopper), langkah lampau jadi centang. Rail terisi beranimasi berurutan (`.rail-fill`, stagger 70ms) — sumbu isian ikut orientasi lewat media query di `globals.css`. Ditutup baris "Langkah N dari 5". |
| CTA | Instruksi Pembayaran (emas solid, hanya bila non-tunai & status `BARU`) → Tanya Status (hijau WA) → Kirim Ulang (outline). |
| Animasi (motion) | Artefak masuk via `animate-reveal` CSS. Rincian struk dianimasikan library `motion` (`OrderReceiptDetails`, client island): stagger 55ms per baris item → baris subtotal/ongkir → blok TOTAL (fade + 8px rise, 400ms easeOut). `MotionConfig reducedMotion="user"` global meredam transform bila diminta OS. |

- Kontras: teks di halaman ini memakai minimum `text-brown/80` di atas cream (pola `/55–/70` gagal AA pada ukuran 12–14px). Hierarki dibawa ukuran + bobot font dan aksen emas, bukan teks pudar.
- `OrderStatusTimeline` menerima `showDescriptions` (default `true`). Deskripsi bersuara pelanggan ("Dimasak fresh untukmu"), jadi detail pesanan admin memanggilnya dengan `showDescriptions={false}` agar panel tetap padat & netral.
- Status `BATAL` menggantikan timeline dengan blok `danger` (ikon + ajakan menghubungi admin), bukan linimasa setengah jalan.

### Invoice (`/invoice/[kode]?token=…`)

- Tombol "Lihat Invoice" muncul di halaman status pelanggan dan detail admin
  mulai status `DIKONFIRMASI`; status `BARU` dan `BATAL` tidak menampilkannya.
- Invoice memakai kode pesanan sebagai nomor dokumen, menampilkan pelanggan,
  waktu WIB, item/varian/add-on, subtotal, ongkir, total, metode, dan keterangan
  pembayaran. Biaya kurir aktual, margin, catatan admin, dan token tidak tampil.
- Halaman berdiri sendiri tanpa header/footer/FAB/bottom bar pelanggan.
- Tombol "Cetak / Simpan PDF" memakai dialog cetak native browser. CSS print
  mengubah dokumen menjadi A4, menyembunyikan tombol, menghapus shadow/radius,
  dan mencegah baris item terpotong antarhalaman.
- Status `SELESAI` ditulis sebagai status pesanan, bukan otomatis "Lunas" untuk
  Tunai/COD karena model data belum memiliki verifikasi pembayaran tunai.

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
| `ProductSheet` | `components/menu/` | Bottom sheet varian (dipakai di `/menu` & home) |
| `ProductDetailClient` | `components/menu/` | Pemilihan inline varian/add-on/note + sticky bar "Tambah" + cross-sell "Lengkapi Pesananmu" di `/produk/[slug]`. Desktop (lg+): besar kanan-kiri bergulir mandiri (`overflow-y:auto` + `overscroll-behavior:contain`, `grid-rows:minmax(0,1fr)`), viewport tinggi `calc(100dvh - header - bar)`; mobile tetap satu kolom mengikuti gulir halaman. Token offset: `--app-header-h`, `--orderbar-footprint`. |
| `QuantityStepper` | `components/common/` | Tombol −/+ |
| `CartItemRow` | `components/cart/` | Baris item keranjang |
| `CartSummary` | `components/cart/` | Ringkasan total |
| `CheckoutForm` | `components/checkout/` | Form + validasi |
| `PaymentMethodPicker` | `components/checkout/` | Kartu metode bayar |
| `QrisPanel` | `components/payment/` | Tampilan QRIS |
| `OrderStatusTimeline` | `components/order/` | Linimasa status (ikon per langkah, rail beranimasi, halo langkah aktif; prop `showDescriptions` — lihat §8.6) |
| `OrderStatusPill` | `components/order/` | Pill status untuk hero gelap `/pesanan/[kode]` |
| `OrderReceiptDetails` | `components/order/` | Badan struk rincian pesanan + animasi stagger `motion` (lihat §8.6 Batch 7) |
| `PrintInvoiceButton` | `components/order/` | Membuka dialog cetak native untuk printer/Save as PDF |
| `EmptyState` | `components/common/` | Kondisi kosong |
| `Price` | `components/common/` | Format rupiah konsisten |
| `Toast` | `components/common/` | Notifikasi singkat |
| `Spinner` | `components/common/` | Indikator busy tombol (lihat §8.9) |

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
| Loading menu (`/menu`, `/menu/[kategori]`) | `KitchenLoader` ("panci dapur") di atas + skeleton kartu grid (bukan spinner penuh layar) |
| Loading detail produk (`/produk/[slug]`) | Skeleton dua kolom; `KitchenLoader` di tengah area foto |
| Loading status pesanan (`/pesanan/[kode]`) | Placeholder berbentuk struk Batch 7 (stub gelap + badan krem + tepi sobek) dengan `KitchenLoader` |
| Loading pembayaran (`/pembayaran/[kode]`) | `KitchenLoader` tengah halaman |
| Keranjang kosong | Ilustrasi + "Keranjang kamu masih kosong. Yuk pilih menu favoritmu!" |
| Menu habis semua | "Menu sedang kosong, cek lagi nanti ya 🙏" |
| Toko tutup | Banner atas + checkout jadi mode pre-order |
| Gagal submit | Toast merah + tombol "Coba Lagi", keranjang tetap aman |
| Halaman tidak ada (404) | Ilustrasi + tombol kembali ke Menu |
| Tautan privat pesanan tidak lengkap (404 di `/pesanan/[kode]` & `/pembayaran/[kode]`) | `EmptyState` "Tautan … tidak bisa dibuka" + `OrderAccessRecovery`: redirect otomatis dari riwayat pesanan perangkat, daftar pesanan terakhir, CTA WhatsApp admin bawa kode |

### `KitchenLoader` — loader kreatif "panci dapur" (2026-08-22)

Komponen bersama `components/common/KitchenLoader.tsx`: SVG panci brand
(brown-deep/ink-soft, sup gold-light) dengan **uap tiga ketak ber-stagger**,
**gelembung sup yang membesar lalu pop**, dan elipsis teks berdenyut.
Animasi murni CSS (kelas `.kitchen-*` di `globals.css`) tanpa JS —
langsung bergerak pada first paint `loading.tsx` sebelum hydration, dan
otomatis statis (uap tetap terlihat) bagi `prefers-reduced-motion`.
Label kontekstual per route ("Memuat menu", "Menyiapkan struk pesanan",
"Menyiapkan pembayaran", "Menyiapkan menu"). Halaman yang dirender instan
dari state lokal (keranjang, checkout) tidak diberi loader route.

### Spinner pada tombol pembayaran/checkout (2026-08)

Tombol yang memicu operasi jaringan wajib menampilkan spinner saat busy —
memakai komponen bersama `components/common/Spinner.tsx` (ikon `Loader2`
berputar, berhenti otomatis bagi `prefers-reduced-motion` via `motion-reduce`,
plus label `sr-only` "Memuat…"):

| Tombol | Saat busy | Implementasi |
|---|---|---|
| "Buat Pesanan" (`/checkout`) | Spinner + teks "Memproses pesanan…" | `CheckoutForm.tsx` |
| "Unggah Bukti Bayar" (`/pembayaran/[kode]`) | Spinner + teks "Menyiapkan gambar…" | `PaymentProofActions.tsx` |

Tombol tetap `disabled` selama busy agar tidak dikirim dua kali. Setelah bukti
terkirim, tombol unggah beranimasi berganti (`AnimatePresence mode="wait"`,
fade + slide 0.22s) menjadi tombol hijau "Saya Sudah Bayar & Kirim Bukti"
disertai mikroteks status "Bukti bayar terkirim…" (`role="status"`). Jika unggah
gagal, pesan `role="alert"` muncul dan tombol tetap di mode unggah.

### Feedback tekan & micro-interactions (2026-08-22)

Standar "handshake" tekan + konfirmasi visual momen penting. Semua hanya
menganimasikan `transform`/`opacity` (GPU-only, aman untuk HP kentang) dan
hormat `prefers-reduced-motion` (rule CSS ditangkap jaring pengaman global;
animasi `motion` oleh `MotionConfig reducedMotion="user"` di ChromeShell).

| Interaksi | Efek | Implementasi |
|---|---|---|
| Semua `<button>` ditekan | Mengecil ke 97% (instant down, snap back) | rule `button:not(:disabled):active` di `globals.css` |
| Link bergaya tombol ditekan | Sama + transisi 100ms | kelas `.btn-press` (`globals.css`) |
| Item masuk keranjang | Badge angka di Header meletup (spring 1.35→1, 200ms) tiap jumlah berubah | `CartBadge.tsx` (`motion.span` keyed) |
| Tombol "Tambah" ditekan | Thumbnail produk **terbang melengkung** dari tombol ke ikon keranjang (busur 90px, 600ms, mengecil ke 20%), lalu badge meletup; di-skip utuh untuk `prefers-reduced-motion` | `CartFlyContext.tsx` (provider di `ChromeShell`, target = `data-cart-target` di Header) |
| Hamburger mobile ditekan | Ikon tiga garis **morf jadi X** (rotasi ±45°, garis tengah fade, 200ms) + panel navigasi slide-fade 180ms; tutup saat pilih menu, klik di luar, atau Escape. Disclosure custom (bukan `<details>`) karena open/close native tidak bisa dianimasi | `Header.tsx` (`HamburgerIcon` + `AnimatePresence`) |
| Navigasi sidebar admin | **Pill aktif meluncur** antar item menu saat rute berubah (spring, layout animation; layoutId unik per surface desktop/drawer) | `AdminSidebar.tsx` |
| Kartu/section admin masuk | Anak langsung container `.stagger-in` muncul berurutan (fade + 8px naik, jeda 45ms, 250ms/item) — dipakai di KPI dashboard, banner status, grid chart, stats pesanan/rekap, section detail pesanan, kategori kelola menu; kartu login pakai `.fade-up` sekali | kelas CSS di `globals.css` |
| Bar "menu terlaris" dashboard | Bar emas **tumbuh dari kiri** (scaleX 0→1, 500ms, delay 120ms) saat mount/ganti periode | kelas `.bar-grow` |
| Jumlah qty berubah | Angka bergeser 4px dari arah perubahan (naik dari bawah saat +), 120ms | `QuantityStepper.tsx` |
| Toast ditutup | Slide down + fade 150ms sebelum unmount (dikelola sendiri, tanpa AnimatePresence di pemakai) | `Toast.tsx` |
| Item keranjang dihapus | Baris collapse (tinggi + opacity turun, 250ms), baris lain meluncur naik (layout animation) | `CartItemRow.tsx` + `AnimatePresence` di `/keranjang` |
| Navigasi halaman | Konten halaman fade-in 150ms (opacity-only); render pertama sesi tanpa fade agar LCP tidak tertunda | `app/template.tsx` |
| Kartu menu masuk | Stagger fade-up 8px per kartu (jeda 30ms, 180ms/kartu) setelah skeleton selesai | `MenuCategorySection.tsx` |
| Kartu pesanan admin berubah status / baru masuk | `<li>` di-key `kode-status` → remount memutar slide-in + flash emas 800ms; pesanan BARU tambah denyut outline flame sekali | keyframes `card-*` di `tailwind.config.ts`, `admin/(panel)/pesanan/page.tsx` |

Aturan durasi: micro 100–150ms, panel/baris 150–250ms; animasi keluar selalu
lebih cepat dari masuk. Jangan animasikan properti layout (`width`/`height`/
`top`/`left`) kecuali collapse baris keranjang (jumlah elemen sedikit).

---

➡️ Lanjut ke `09_TECH_STACK.md`
