# 14 - Admin Dashboard

Dashboard dirancang untuk **admin non-teknis** yang mayoritas memakai HP.
Prinsip: sedikit tombol, aksi cepat, informasi penting terlihat tanpa scroll.

---

## 14.1 Autentikasi

| Item | Keputusan |
|---|---|
| Metode | Supabase Auth - email + password |
| Jumlah akun | 1-2 (pemilik & admin) |
| Registrasi mandiri | Dinonaktifkan. Akun dibuat manual dari dashboard Supabase |
| Proteksi route | Middleware Next.js pada `/admin/*` |
| Sesi | 7 hari, dengan tombol "Keluar" |
| Lupa password | Reset lewat email Supabase |

```ts
// middleware.ts (ringkas)
export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next()
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next()

  const supabase = createMiddlewareClient(req)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ["/admin/:path*"] }
```

---

## 14.2 Halaman: Daftar Pesanan (`/admin/pesanan`)

### Bagian atas - ringkasan hari ini

Empat kartu statistik berjajar:

| Kartu | Contoh nilai |
|---|---|
| Pesanan hari ini | 23 |
| Menunggu konfirmasi | 4 |
| Sedang diproses | 6 |
| Omzet hari ini | Rp1.450.000 |

### Filter

- Dropdown rentang tanggal: Hari Ini / 7 Hari / Bulan Ini / Pilih tanggal
- Dropdown status: Semua / BARU / DIKONFIRMASI / DIPROSES / DIKIRIM / SELESAI / BATAL
- Kolom pencarian: kode pesanan atau nama pelanggan

### Kartu pesanan (tampilan mobile)

Setiap pesanan ditampilkan sebagai kartu berisi:

1. Baris 1: kode pesanan (tebal) + badge status berwarna
2. Baris 2: jam pesan, nama pelanggan, tipe (Antar / Ambil)
3. Baris 3: jumlah item, total, metode bayar
4. Baris 4: tombol "Lihat Detail" dan satu tombol aksi cepat sesuai status

### Warna badge status

| Status | Warna |
|---|---|
| BARU | Kuning (`--flame`) |
| DIKONFIRMASI | Biru |
| DIPROSES | Oranye |
| DIKIRIM | Ungu |
| SELESAI | Hijau |
| BATAL | Merah (`--chili`) |

### Perilaku

- Urutan default: terbaru di atas.
- Auto-refresh setiap 30 detik (atau Supabase Realtime bila mudah dipasang).
- Pesanan berstatus BARU diberi penanda menonjol dan suara notifikasi opsional.
- Aksi cepat dapat dilakukan langsung dari kartu tanpa membuka halaman detail.

---

## 14.3 Halaman: Detail Pesanan

Susunan konten dari atas ke bawah:

1. **Header** - kode pesanan, badge status, tanggal & jam WIB
2. **Data pemesan** - nama, nomor WhatsApp (tombol Chat + Salin), tipe pesanan,
   alamat lengkap dan patokan (bila Antar)
3. **Rincian item** - nama item, varian, add-on, catatan, jumlah, subtotal per baris
4. **Ringkasan biaya** - subtotal, input ongkir yang bisa diisi admin, total
5. **Pembayaran** - metode, status, tombol "Lihat bukti transfer" bila sudah diunggah
6. **Catatan pelanggan** - teks apa adanya dari pelanggan
7. **Catatan admin** - textarea yang bisa disimpan
8. **Aksi status** - deretan tombol: Konfirmasi, Proses, Kirim, Selesai, Batal

Aturan:
- Tombol status yang tidak sah menurut state machine di `04_BUSINESS_FLOW.md`
  harus **dinonaktifkan**, bukan disembunyikan.
- Aksi "Batal" memerlukan konfirmasi dua langkah.
- Setelah ongkir disimpan, total dihitung ulang di server dan muncul notifikasi
  "Total diperbarui".
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

Menampilkan seluruh item dikelompokkan per kategori. Setiap baris berisi:

- Nama item
- Harga saat ini
- Toggle ketersediaan: **Ada** / **Habis**

Tombol massal di bawah daftar:

- "Tandai Semua Habis" - untuk saat tutup atau kehabisan bahan
- "Buka Semua" - untuk membuka kembali di awal hari

Aturan:
- Toggle ketersediaan disimpan ke tabel `menu_overrides`.
- Perubahan tampil di sisi pelanggan maksimal 60 detik (ISR revalidate).
- Perubahan harga (Fase 2 lanjutan) memerlukan konfirmasi dan tercatat di log.
- Item yang ditandai habis tampil abu-abu di sisi pelanggan dan tidak bisa dipesan.

---

## 14.5 Halaman: Rekap (`/admin/rekap`)

Filter periode: Hari Ini / 7 Hari / Bulan Ini / Pilih tanggal.

### Metrik utama

| Metrik | Keterangan |
|---|---|
| Total pesanan | Semua pesanan pada periode |
| Pesanan selesai | Status SELESAI |
| Pesanan batal | Status BATAL |
| Omzet | Hanya dari pesanan SELESAI |
| Rata-rata per transaksi | Omzet dibagi jumlah pesanan selesai |

### Menu terlaris

Daftar 5 item teratas berdasarkan jumlah porsi/cup terjual pada periode.

### Metode pembayaran

Jumlah pesanan per metode: QRIS, Transfer, Tunai.

### Ekspor

Tombol "Unduh CSV" - pemisah koma, encoding UTF-8 dengan BOM agar rapi dibuka di Excel.

Catatan:
- Omzet **hanya** menghitung pesanan berstatus SELESAI.
- Zona waktu perhitungan: **Asia/Jakarta**.

---

## 14.6 Prinsip UX dashboard

1. Satu ketukan untuk aksi paling sering dilakukan (konfirmasi pesanan).
2. Semua tombol berukuran minimal 44x44px - admin sering memakai satu tangan.
3. Gunakan warna **dan** ikon bersamaan, jangan mengandalkan warna saja.
4. Tidak ada aksi destruktif tanpa konfirmasi.
5. Selalu tampilkan waktu dalam WIB dengan format Indonesia.
6. Dashboard boleh tampil sederhana - kecepatan lebih penting daripada estetika.
7. Sediakan indikator loading yang jelas; admin sering berada di koneksi lambat.

---

Lanjut ke `15_SEO_CONTENT.md`
