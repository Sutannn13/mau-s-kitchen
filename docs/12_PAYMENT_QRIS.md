# 12 — Pembayaran: QRIS Statis Manual dan Rencana QRIS Dinamis

## 12.1 Kondisi saat ini

Website memakai **QRIS statis** resmi dengan nama merchant
**SATE TAICHAN HANNA**. Pelanggan memindai QR yang sama untuk setiap pesanan,
memasukkan nominal secara manual, lalu admin memverifikasi bukti/mutasi.

QRIS dinamis tetap dapat dibuat manual melalui aplikasi merchant:

| Penyedia | Jenis | Cara pakai saat ini |
|---|---|---|
| **DANA** (DANA Bisnis) | QRIS dinamis | Admin ketik nominal di aplikasi → muncul QR → pelanggan pindai |
| **BCA** (QRIS merchant BCA / myBCA Bisnis) | QRIS dinamis | Sama, nominal diketik lebih dulu |
| **GoPay** (GoBiz / GoPay Merchant) | QRIS dinamis | Sama |

**Penting untuk dipahami developer:**

> QRIS dinamis yang dibuat dari aplikasi merchant **hanya bisa dibuat manual oleh admin**
> dan tidak punya API publik yang bisa dipanggil website. Artinya website **tidak dapat**
> membuat QRIS dinamis otomatis per pesanan tanpa payment gateway.

Karena itu, penerapannya dibagi menjadi tiga fase.

---

## 12.2 Fase 1 — QRIS statis + nominal manual (MVP, biaya Rp0)

**Cara kerja:**

```
Pelanggan checkout
   ↓
Halaman /pembayaran/[kode] menampilkan:
   · Kode pesanan
   · Nominal total (dengan tombol "Salin nominal")
   · Gambar QRIS statis MAU'S Kitchen
   ↓
Pelanggan pindai QRIS → ketik nominal sendiri → bayar
   ↓
Pelanggan tekan "Saya Sudah Bayar & Kirim Bukti"
   ↓
WhatsApp terbuka dengan pesan konfirmasi otomatis
   ↓
Admin cek mutasi → konfirmasi pesanan
```

**Aturan total sebelum bayar:**

- Ambil Sendiri langsung memakai ongkir Rp0 dan total final.
- Antar dengan `delivery_fee = null` hanya menampilkan subtotal sementara.
  QRIS/transfer, klaim bayar, dan upload bukti disembunyikan serta ditolak API.
- Setelah admin menyimpan ongkir, halaman diperbarui otomatis dan menampilkan
  total final. Rp0 tetap dianggap ongkir final yang sah.
- Ongkir tidak dapat diubah setelah klaim/bukti pembayaran atau status
  `DIKONFIRMASI`.

**Kebutuhan aset:**

| Aset | Keterangan |
|---|---|
| `public/assets/payment/qris.jpeg` | Gambar QRIS statis resmi merchant |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Nomor rekening BCA untuk opsi transfer |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Nama pemilik rekening |

**Kelebihan:** gratis, langsung jalan, tidak butuh dokumen legal tambahan.
**Kekurangan:** nominal diketik manual, verifikasi masih manual.

### Tips mengurangi kesalahan nominal

1. Tampilkan nominal sangat besar dan jelas, dengan tombol salin.
2. Tambahkan **kode unik 3 digit terakhir** agar mutasi mudah dicocokkan.
   Contoh: total Rp118.000 → tagih **Rp118.007** (007 = urutan pesanan hari itu).
   ```ts
   // total unik = total dibulatkan ke ribuan + urutan harian
   export const uniqueTotal = (total: number, seq: number) =>
     Math.floor(total / 1000) * 1000 + (seq % 1000)
   ```
3. Tampilkan pengingat: *"Transfer sesuai nominal unik supaya pesanan cepat dikonfirmasi."*

---

## 12.3 Fase 2 — Bukti pembayaran + verifikasi terstruktur

**Tambahan dari Fase 1:**

- Pelanggan dapat mengunggah bukti pembayaran lewat `POST /api/orders/[kode]/proof`.
- Bukti muncul di dashboard admin, bisa dilihat langsung tanpa membuka WhatsApp.
- Admin tekan **Konfirmasi** atau **Tolak** → status pesanan berubah otomatis.
- Batas waktu pembayaran 60 menit; lewat itu admin bisa membatalkan.

---

## 12.4 Fase 3 — QRIS dinamis otomatis via payment gateway (opsional)

Jika volume pesanan sudah tinggi dan admin kewalahan verifikasi manual,
barulah gunakan payment gateway yang menyediakan **QRIS dinamis via API**.

| Gateway | Biaya QRIS (perkiraan) | Catatan |
|---|---|---|
| **Midtrans** | ≈ 0,7% per transaksi | Dokumentasi paling lengkap di Indonesia, cocok UMKM |
| **Xendit** | ≈ 0,7% per transaksi | API rapi, dashboard bagus |
| **iPaymu / Duitku** | ≈ 0,7% + biaya tetap | Alternatif lokal |

> Angka di atas **perkiraan**; wajib dicek ulang di halaman harga resmi masing-masing
> penyedia sebelum diputuskan.

### Alur target Fase 3

```
Checkout → POST /api/payments/qris
              ↓
     Gateway membuat QRIS dinamis (nominal terkunci, kedaluwarsa 15 menit)
              ↓
     Website menampilkan QR + hitung mundur
              ↓
     Pelanggan bayar dari DANA / GoPay / OVO / m-banking
              ↓
     Gateway kirim webhook → POST /api/webhooks/payment
              ↓
     Verifikasi signature → status pesanan otomatis "DIKONFIRMASI"
              ↓
     Notifikasi WhatsApp otomatis ke admin & pelanggan
```

### Checklist keamanan webhook

- [ ] Verifikasi signature/hash dari gateway sebelum memproses.
- [ ] Endpoint webhook **idempotent** (satu pembayaran tidak boleh diproses dua kali).
- [ ] Cocokkan `order_id` **dan** nominal sebelum mengubah status.
- [ ] Catat semua payload webhook ke tabel log untuk audit.
- [ ] Jangan pernah mempercayai status pembayaran yang dikirim dari browser.

---

## 12.5 Konfigurasi pembayaran di kode

```ts
// config/payment.ts
export const paymentConfig = {
  qris: {
    enabled: true,
    imagePath: process.env.NEXT_PUBLIC_QRIS_IMAGE_PATH ?? "/assets/payment/qris.jpeg",
    merchantName: process.env.NEXT_PUBLIC_QRIS_MERCHANT_NAME ?? "SATE TAICHAN HANNA",
    supportedApps: ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja", "m-banking"],
    note: "Bisa dibayar dari aplikasi e-wallet atau m-banking apa pun.",
  },
  transfer: {
    enabled: true,
    bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "BCA",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "TBD",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "TBD",
  },
  cash: {
    enabled: true,
    label: "Tunai / COD",
    note: "Bayar saat pesanan diterima. Siapkan uang pas ya.",
  },
  paymentWindowMinutes: 60,
} as const
```

---

## 12.6 Teks UI pembayaran (siap pakai)

| Konteks | Teks |
|---|---|
| Judul halaman | "Selesaikan Pembayaran" |
| Sub-judul | "Pesanan kamu sudah kami catat. Tinggal bayar ya 🙌" |
| Label QRIS | "Scan QRIS di bawah ini" |
| Keterangan QRIS | "Bisa dibayar pakai DANA, GoPay, OVO, ShopeePay, atau m-banking apa pun." |
| Peringatan nominal | "Pastikan nominal sesuai, termasuk 3 angka terakhir ya." |
| Tombol utama | "Saya Sudah Bayar & Kirim Bukti" |
| Tombol sekunder | "Kirim Ulang Pesanan ke WhatsApp" |
| Info tunai | "Kamu memilih bayar tunai. Siapkan Rp118.000 saat pesanan datang ya." |
| Catatan bawah | "Pesanan diproses setelah pembayaran dikonfirmasi admin." |

---

## 12.7 Yang WAJIB ditanyakan ke pemilik usaha

- [x] File gambar QRIS statis merchant (`public/assets/payment/qris.jpeg`)

### Pengaman konfigurasi

QRIS dan transfer default-nya nonaktif. Aktifkan hanya melalui
`NEXT_PUBLIC_ENABLE_QRIS=true` atau `NEXT_PUBLIC_ENABLE_TRANSFER=true` setelah
aset/rekening dikonfirmasi pemilik. API memvalidasi ulang pilihan pelanggan;
nilai `TBD` tidak pernah dianggap rekening aktif. Tunai/COD dikendalikan oleh
`NEXT_PUBLIC_ENABLE_CASH`.

Untuk QRIS, kedua syarat berikut wajib dipenuhi sebelum flag diaktifkan:

1. File resmi tersedia tepat di `public/assets/payment/qris.jpeg` (atau path
   lain yang sama dengan `NEXT_PUBLIC_QRIS_IMAGE_PATH`).
2. Gambar sudah diuji pindai dengan nominal kecil oleh pemilik.
3. Nama merchant pada layar pembayaran cocok dengan
   `NEXT_PUBLIC_QRIS_MERCHANT_NAME` (`SATE TAICHAN HANNA`).

Jika file belum ada, biarkan `NEXT_PUBLIC_ENABLE_QRIS=false`; jangan menawarkan
metode QRIS yang hanya berakhir di placeholder.
- [ ] Nomor rekening BCA + nama pemilik rekening
- [ ] Apakah boleh menggunakan skema nominal unik 3 digit?
- [ ] Minimum order untuk pengiriman
- [ ] Tarif ongkir per zona (atau tetap manual per pesanan?)
- [ ] Jam operasional resmi
- [ ] Apakah menerima pembayaran tunai/COD?

---

➡️ Lanjut ke `13_WHATSAPP_INTEGRATION.md`
