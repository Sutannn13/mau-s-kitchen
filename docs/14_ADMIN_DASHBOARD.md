# 14 - Admin Dashboard

Dashboard dirancang untuk **admin non-teknis** yang mayoritas memakai HP.
Prinsip: sedikit tombol, aksi cepat, informasi penting terlihat tanpa scroll.

---

## 14.0 Shell Admin & Dashboard Analitik (`/admin`)

> Ditambahkan saat redesain premium (Agustus 2026): navigasi admin berpindah
> dari navbar atas menjadi **sidebar**, dan `/admin` yang sebelumnya dialihkan
> ke `/admin/pesanan` kini menjadi halaman **Dashboard Analitik**.

### Shell admin (sidebar)

- Area `/admin/*` tidak lagi menampilkan Header/Footer/FAB situs pelanggan.
  `src/proxy.ts` menempel penanda `x-admin-route` pada request admin; root
  layout (`src/app/layout.tsx`) membaca header itu dan menyembunyikan chrome
  publik. Otentikasi di proxy tidak berubah.
- Desktop (≥1024px): sidebar tetap (fixed) 264px, latar gradasi choco →
  brown-deep dengan aksen emas; berisi logo, navigasi (Dashboard, Pesanan,
  Kelola Menu, Rekap), tautan "Lihat Situs Pelanggan", kartu profil admin
  (email + inisial), dan tombol Keluar.
- Seluler: bilah atas (hamburger + brand) dan drawer geser dari kiri; drawer
  tertutup saat link diklik atau tombol Escape ditekan.
- Komponen `src/components/admin/AdminSidebar.tsx` menggantikan AdminNav
  (navbar atas lama, sudah dihapus).
- Status ciut/lebar sidebar dibaca lewat `useSyncExternalStore` (snapshot
  server selalu "expanded"), sehingga preferensi di `localStorage` tidak lagi
  memicu error hydration mismatch saat hard refresh.
- **Pill navigasi aktif meluncur** antar item menu saat rute berubah
  (spring layout animation, `layoutId` unik per surface desktop/drawer —
  upgrade animasi 2026-08-23). Seluruh panel admin juga memakai kelas
  `.stagger-in` (kartu/section masuk berurutan fade-up 45ms) dan bar
  "menu terlaris" dashboard tumbuh dari kiri (`.bar-grow`) — keduanya
  CSS murni di `globals.css`, dimatikan otomatis oleh jaring pengaman
  `prefers-reduced-motion`.

### Isi dashboard

> **Polish premium 2026-08-23** (hasil audit GUI): kartu KPI memakai ikon
> chip gradien emas + badge trend berbentuk pill berwarna (hijau/merah/
> netral) + hover shadow; banner "Status Hari Ini" punya glow emas
> dekoratif (blob blur, `overflow-hidden`) + ring emas + ikon kecil pada
> mini-stat; header tiap `PanelCard` diberi garis pemisah tipis dan hover
> shadow. Dua perbaikan layout: (1) kurva omzet pada data **satu titik**
> (mis. periode Hari Ini) kini menampilkan kartu ringkasan angka tunggal —
> area chart collapse di tepi dianggap rusak; (2) lebar sumbu kanan chart
> pesanan dilebarkan (28→36 + margin) agar label tidak terpotong.

1. **Pemilih periode** — Hari Ini / 7 Hari / Bulan Ini (default 7 hari)
   melalui query `?periode=`; mengendalikan seluruh panel analitik.
   Toggle ini kini berupa **pill geser animatif**
   (`src/components/admin/dashboard/PeriodeSwitcher.tsx`): navigasi tetap
   server-side (`<Link>` + searchParams, tanpa `useState`), sedangkan latar
   emas meluncur antar tab lewat shared layout animation
   (`motion.span layoutId="periode-pill"`). Saat periode berganti, blok
   KPI + chart + tabel dibungkus
   `AnimatedSection` (`key={periode}`) agar konten fade-in ulang dan chart
   Recharts memutar ulang animasi bawaannya.
2. **Banner Status Hari Ini** (selalu hari ini, tidak terpengaruh periode) —
   jumlah pesanan menunggu konfirmasi + CTA "Konfirmasi Sekarang" ke
   `/admin/pesanan?status=BARU`, ringkas pesanan hari ini / sedang diproses /
   omzet hari ini (dari `getTodayStats`).
3. **Kartu KPI periode** — Omzet (SELESAI), Total Pesanan, Rata-rata per
   Transaksi, Pesanan Batal (dari `getRekapData`).
4. **Kurva Tren Omzet & Pesanan** — Recharts ComposedChart: area omzet
   (emas, sumbu kiri) + garis putus jumlah pesanan (coklat, sumbu kanan);
   deret harian dari `getDailySeries` (tanggal kosong diisi 0 agar kurva
   tanpa celah).
5. **Lingkaran persen Tingkat Penyelesaian** — RadialBarChart skala 0–100;
   persen pesanan SELESAI terhadap total pesanan periode.
6. **Menu Terlaris** — 5 item teratas dengan bar proporsional.
7. **Donut Metode Pembayaran** — distribusi QRIS / Transfer / Tunai berupa
   jumlah dan persentase (warna: emas / coklat tua / pistachio).

Komponen chart (client) berada di `src/components/admin/dashboard/` dan hanya
dimuat di `/admin`, sehingga bundle halaman pelanggan tidak bertambah.

### Pola MotionProvider (aksesibilitas gerak)

Seluruh konten panel admin dibungkus
`src/components/admin/MotionProvider.tsx` — sebuah client component yang
membungkus `MotionConfig reducedMotion="user"` dari library `motion`. Efeknya:
semua animasi admin (pill periode, fade konten) otomatis dinonaktifkan bila
pengguna menyetel `prefers-reduced-motion: reduce` di sistemnya. Komponen
animasi selalu `"use client"` dan hanya boleh memakai satu `layoutId` unik
per halaman.

Aturan data tidak berubah: omzet hanya menghitung pesanan SELESAI, zona waktu
Asia/Jakarta, seluruh angka dari Supabase lewat `lib/admin/orders.ts`.

---

## 14.1 Autentikasi

| Item               | Keputusan                                                 |
| ------------------ | --------------------------------------------------------- |
| Metode             | Supabase Auth - email + password                          |
| Jumlah akun        | 1-2 (pemilik & admin)                                     |
| Registrasi mandiri | Dinonaktifkan. Akun dibuat manual dari dashboard Supabase |
| Proteksi route     | Proxy Next.js pada `/admin/*`, allowlist `ADMIN_EMAILS`   |
| Sesi               | 7 hari, dengan tombol "Keluar"                            |
| Lupa password      | Reset lewat email Supabase                                |

```ts
// src/proxy.ts (ringkas)
export async function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const supabase = createMiddlewareClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

Selain sesi valid, email wajib ada di `ADMIN_EMAILS` atau user memiliki custom
claim `app_metadata.role=admin`. RLS database juga hanya menerima custom claim
admin; user Supabase biasa tidak memperoleh akses. Signup publik wajib dimatikan
di dashboard Supabase dan diperiksa ulang oleh `npm run security:preflight`.

---

## 14.2 Halaman: Daftar Pesanan (`/admin/pesanan`)

### Bagian atas - ringkasan hari ini

Empat kartu statistik berjajar:

| Kartu               | Contoh nilai |
| ------------------- | ------------ |
| Pesanan hari ini    | 23           |
| Menunggu konfirmasi | 4            |
| Sedang diproses     | 6            |
| Omzet hari ini      | Rp1.450.000  |

### Filter

- Dropdown rentang tanggal: Hari Ini / 7 Hari / Bulan Ini / Pilih tanggal
- Dropdown status: Semua / BARU / DIKONFIRMASI / DIPROSES / DIKIRIM / SELESAI / BATAL
- Kolom pencarian: kode pesanan atau nama pelanggan

### Kartu pesanan (tampilan mobile)

Setiap pesanan ditampilkan sebagai kartu berisi:

1. Baris 1: kode pesanan (tebal) + badge status berwarna
2. Baris 2: jam pesan, nama pelanggan, tipe (Antar / Ambil)
3. Baris 3: jumlah item, total, metode bayar
4. Baris 4: tombol "Lihat Detail" dan dropdown "Ubah status"

### Warna badge status

| Status       | Warna              |
| ------------ | ------------------ |
| BARU         | Kuning (`--flame`) |
| DIKONFIRMASI | Biru               |
| DIPROSES     | Oranye             |
| DIKIRIM      | Ungu               |
| SELESAI      | Hijau              |
| BATAL        | Merah (`--chili`)  |

### Perilaku

- Urutan default: terbaru di atas.
- Auto-refresh setiap 30 detik (atau Supabase Realtime bila mudah dipasang).
- Pesanan berstatus BARU diberi penanda menonjol dan suara notifikasi opsional.
- Dropdown "Ubah status" memuat semua status sah setelah status saat ini
  (admin bisa lompat langsung, mis. Baru → Selesai, tanpa maju satu-satu).
  Panel dibuat custom (bukan `<select>` native) dengan animasi buka/tutup
  (fade + scale + chevron berputar; otomatis nonaktif untuk
  `prefers-reduced-motion`). Memilih "Batal" memunculkan **konfirmasi dua
  langkah di dalam panel** — bukan `window.confirm`, karena dialog native
  bisa di-auto-accept webview dan pesanan bisa terbatal tanpa sengaja.
  Pesanan final (Selesai/Batal) menampilkan dropdown nonaktif.
- Untuk pesanan `BARU` dengan QRIS/transfer, dropdown cepat tidak melakukan
  perubahan status dan mengarahkan admin ke halaman detail. Di halaman detail,
  admin harus mencocokkan mutasi/bukti dengan total server lalu mencentang
  acknowledgement sebelum status dapat dimajukan. Tombol tetap nonaktif sampai
  klaim bayar atau bukti unggahan tersedia. API menegakkan aturan yang sama
  untuk menutup bypass request langsung.
- Panel dropdown dirender ke `document.body` sebagai overlay berposisi tetap,
  membuka ke atas bila ruang bawah sempit, dan dibatasi tinggi viewport. Ini
  mencegah panel tertutup kartu berikutnya atau terpotong stacking context
  animasi kartu.
- Update status/catatan/rencana pengantaran memakai versi pesanan yang sedang dilihat. Bila
  tab atau admin lain sudah menyimpan lebih dulu, API mengembalikan
  `409 ORDER_CONFLICT`; tampilkan error dan muat ulang, jangan menimpa diam-diam.

---

## 14.3 Halaman: Detail Pesanan

Susunan konten dari atas ke bawah:

1. **Header** - kode pesanan, badge status, tanggal & jam WIB
2. **Data pemesan** - nama, nomor WhatsApp (tombol Chat + Salin), tipe pesanan,
   alamat lengkap dan patokan (bila Antar)
3. **Rincian item** - nama item, varian, add-on, catatan, jumlah, subtotal per baris
4. **Ringkasan biaya** - subtotal, ongkir pelanggan, provider, biaya kurir aktual,
   margin/subsidi ongkir, dan total
5. **Pembayaran** - metode, status, tombol "Lihat bukti transfer" bila sudah diunggah
6. **Catatan pelanggan** - teks apa adanya dari pelanggan
7. **Catatan admin** - textarea yang bisa disimpan
8. **Aksi status** - deretan tombol: Konfirmasi, Proses, Kirim, Selesai, Batal
9. **Invoice** - tombol "Buka Invoice" sejak status DIKONFIRMASI; membuka
   dokumen privat siap cetak/PDF pada tab baru

Aturan:

- Tombol status yang tidak sah menurut state machine di `04_BUSINESS_FLOW.md`
  harus **dinonaktifkan**, bukan disembunyikan.
- Aksi "Batal" memerlukan konfirmasi dua langkah.
- Ambil Sendiri menampilkan ongkir tetap Rp0 tanpa input.
- Antar berstatus `BARU` harus diberi provider, ongkir pelanggan, dan biaya
  kurir aktual sebelum tombol Konfirmasi aktif.
- Ketiga nilai disimpan atomik. Provider internal memakai biaya aktual Rp0;
  GoSend/GrabExpress/kurir lain memakai harga aktual dari aplikasi/kurir.
- Tunai/COD hanya mengizinkan provider internal.
- Setelah disimpan, total dan selisih ongkir dihitung ulang; biaya aktual dan
  margin/subsidi hanya terlihat admin.
- Input pengantaran terkunci setelah klaim/bukti atau status dikonfirmasi.
- Tombol "Chat" membuka WhatsApp dengan template balasan admin.

### Template chat balasan admin

```
Halo kak Rizky
Pesanan *MK-260814-007* sudah kami terima.
Total: Rp152.000 (termasuk ongkir Rp0)
Estimasi siap: 25 menit.
Terima kasih sudah pesan di MAU'S Kitchen
```

---

## 14.4 Halaman: Kelola Menu (`/admin/menu`)

> Sejak FR-27 (Admin CRUD Menu Mandiri), halaman ini berkembang dari sekadar
> toggle ketersediaan menjadi **CRUD penuh**: kategori + item + varian +
> add-on + urutan tampil + best seller + arsip (soft delete). Sumber
> kebenaran katalog pindah dari `data/menu.json` ke tabel Supabase
> `menu_items` + relasi (lihat `docs/10_DATA_MODEL.md` §10.3).

### Daftar per kategori

Setiap baris item berisi:

- Nama item (dengan ikon bintang untuk Best Seller, suffix "(tambahan)" untuk
  item tambahan)
- Harga saat ini (atau rentang varian)
- Toggle ketersediaan: **Ada** / **Habis**
- Tombol Edit (buka editor modal)
- Tombol Arsip / Pulihkan (soft delete: `archived=true`)

### Tombol massal di atas daftar

- "Tandai Semua Habis" — untuk saat tutup atau kehabisan bahan
- "Buka Semua" — untuk membuka kembali di awal hari
- "Tambah Item" — buka editor item baru
- "Kelola Add-on" — panel inline untuk tambah/hapus add-on global

### Editor item (modal)

Empat tab sederhana untuk admin non-teknis:

1. **Detail** — ID (slug), kategori, nama, deskripsi, harga dasar, satuan,
   urutan tampil, toggle Best Seller / Item Tambahan.
2. **Varian** — daftar multi-row (id, nama, harga) untuk ukuran seperti
   Small/Medium ChocoBerry. Bisa tambah/hapus baris.
3. **Tambahan** — multi-select dari daftar add-on global.
4. **Foto** — unggah gambar (JPG/PNG/WebP, maks 3MB), dioptimasi otomatis ke
   WebP ≤ 250KB via `sharp`, disimpan di bucket publik `menu-images`.

### Aturan

- Penyimpanan satu item (field utama + replace varian + replace add-on) harus
  atomik. Dashboard hanya menampilkan sukses setelah RPC transaksi selesai.

- Toggle ketersediaan & semua mutasi disimpan langsung di tabel
  `menu_items.available` (tidak lagi `menu_overrides`).
- `revalidatePath("/", "layout")` dipanggil setelah setiap mutasi agar ISR
  cache di-bust lebih cepat dari jendela 60 detik.
- Validasi referensial: `categoryId` harus ada & tidak diarsip; `addOnIds`
  harus ada di `menu_addons`. Slug duplikat → 409 `DUPLICATE_SLUG`.
- Arsip kategori yang masih punya item aktif → 409 `CATEGORY_NOT_EMPTY`.
- Upload gambar: rate-limit `menuimg:<ip>` 6/menit; gambar 5MB → 413.
- Saat Supabase down saat checkout, server menolak dengan 503
  `MENU_STORE_UNAVAILABLE` (tidak pakai fallback JSON yang mungkin stale).
- Item yang ditandai habis tampil abu-abu di sisi pelanggan dan tidak bisa
  dipesan.
- Perubahan harga langsung berlaku; harga checkout selalu dihitung ulang
  dari DB (hard rule AGENTS.md: tidak mempercayai input browser).

---

## 14.5 Halaman: Rekap (`/admin/rekap`)

Filter periode: Hari Ini / 7 Hari / Bulan Ini / Pilih tanggal.

### Metrik utama

| Metrik                  | Keterangan                          |
| ----------------------- | ----------------------------------- |
| Total pesanan           | Semua pesanan pada periode          |
| Pesanan selesai         | Status SELESAI                      |
| Pesanan batal           | Status BATAL                        |
| Omzet                   | Hanya dari pesanan SELESAI          |
| Rata-rata per transaksi | Omzet dibagi jumlah pesanan selesai |

### Menu terlaris

Daftar 5 item teratas berdasarkan jumlah porsi/cup terjual pada periode.

### Metode pembayaran

Jumlah pesanan per metode: QRIS, Transfer, Tunai.

### Ekspor

Ekspor utama adalah **Unduh Excel** (`.xlsx`) yang dibuat lokal di browser admin
dan terdiri dari:

1. `Ringkasan`: kartu KPI berbasis rumus, metode pembayaran, menu paling banyak
   dipesan, dan pemeriksaan konsistensi total.
2. `Pesanan`: tabel berfilter dengan header beku, tanggal WIB, format Rupiah,
   warna status, provider, ongkir pelanggan, biaya kurir aktual, selisih ongkir,
   dan kolom pemeriksaan total.
3. `Item Pesanan`: rincian varian/add-on, jumlah, harga satuan, serta total baris
   berbasis rumus.

Tombol **CSV Mentah** tetap tersedia untuk interoperabilitas. CSV hanya berisi
satu tabel detail yang bersih dengan pemisah koma dan encoding UTF-8 BOM; format
CSV tidak digunakan untuk tampilan bermerek karena tidak mendukung warna,
ukuran kolom, beberapa sheet, tabel Excel, atau rumus yang dapat diaudit.

Catatan:

- Omzet **hanya** menghitung pesanan berstatus SELESAI.
- Zona waktu perhitungan: **Asia/Jakarta**.
- File Excel adalah laporan internal karena memuat biaya kurir aktual dan
  selisih ongkir.

---

## 14.6 Prinsip UX dashboard

1. Satu ketukan untuk aksi paling sering dilakukan (konfirmasi pesanan).
2. Semua tombol berukuran minimal 44x44px - admin sering memakai satu tangan.
3. Gunakan warna **dan** ikon bersamaan, jangan mengandalkan warna saja.
4. Tidak ada aksi destruktif tanpa konfirmasi.
5. Selalu tampilkan waktu dalam WIB dengan format Indonesia.
6. Tampilan dashboard premium namun tetap ringan: chart hanya dimuat di
   `/admin`, data hasil agregasi server (bukan komputasi browser), dan tanpa
   animasi berat.
7. Sediakan indikator loading yang jelas; admin sering berada di koneksi lambat.

---

Lanjut ke `15_SEO_CONTENT.md`
