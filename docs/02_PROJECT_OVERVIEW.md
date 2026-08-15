# 02 — Project Overview

## 2.1 Ringkasan bisnis

| Aspek | Keterangan |
|---|---|
| Nama usaha | MAU'S Kitchen |
| Kategori | UMKM Food & Beverage (kuliner rumahan) |
| Model bisnis | B2C — pesan antar (delivery), take away, dan pre-order |
| Kanal saat ini | WhatsApp, media sosial, booth/offline |
| Lini produk | Taichan · Minuman · ChocoBerry |
| Rentang harga | Rp5.000 – Rp40.000 |
| Rata-rata nilai transaksi (asumsi) | Rp45.000 – Rp70.000 |
| Metode bayar | QRIS dinamis (DANA, BCA, GoPay), transfer, tunai/COD |

## 2.2 Value proposition

> "Taichan pedas nampol + minuman segar + dessert buah coklat premium, dibuat rumahan
> dengan bahan segar, bisa dipesan hanya lewat satu link."

Pembeda utama:

1. **Satu brand, tiga craving** — makanan pedas, minuman, dan dessert manis dalam satu pesanan.
2. **ChocoBerry** sebagai produk *hero* yang sangat fotogenik → kuat untuk konten sosial media.
3. Sambal taichan bisa ditambah terpisah (Rp5.000) → personalisasi tingkat kepedasan.
4. Homemade, bukan pabrikan → cerita brand yang hangat dan personal.

## 2.3 Target pengguna

### Persona 1 — "Anak kos lapar malam"

| Atribut | Detail |
|---|---|
| Usia | 17–25 tahun (pelajar/mahasiswa) |
| Perangkat | HP Android, kuota terbatas |
| Kebutuhan | Makan malam murah, pedas, cepat |
| Perilaku | Cari lewat status WA/Instagram, pesan malam hari |
| Kebutuhan dari website | Harga jelas, proses ≤ 3 klik, bisa bayar QRIS |

### Persona 2 — "Pekerja muda pemburu dessert"

| Atribut | Detail |
|---|---|
| Usia | 22–35 tahun |
| Kebutuhan | Dessert estetik untuk diri sendiri / hadiah kecil |
| Perilaku | Klik dari bio Instagram, sensitif visual |
| Kebutuhan dari website | Foto produk besar, varian & topping jelas |

### Persona 3 — "Pemesan acara / patungan kantor"

| Atribut | Detail |
|---|---|
| Usia | 25–45 tahun |
| Kebutuhan | Pesan banyak porsi untuk acara/arisan/rapat |
| Kebutuhan dari website | Bisa atur jumlah besar, estimasi total, catatan pesanan, pre-order H-1 |

### Persona 4 — "Admin MAU'S Kitchen" (internal)

| Atribut | Detail |
|---|---|
| Kebutuhan | Terima pesanan rapi, tandai status, rekap harian |
| Perangkat | HP, kadang laptop |
| Kebutuhan dari website | Dashboard sederhana, notifikasi WhatsApp, ubah status 1 tap |

## 2.4 Tujuan & metrik keberhasilan

| Tujuan | Metrik | Target 3 bulan |
|---|---|---|
| Kurangi pertanyaan berulang | % chat yang langsung berisi pesanan | ≥ 60% |
| Tingkatkan konversi | Pengunjung → checkout | ≥ 8% |
| Percepat proses admin | Waktu catat pesanan | < 1 menit/pesanan |
| Naikkan nilai transaksi | Rata-rata item per pesanan | ≥ 2,5 item |
| Kehadiran online | Kunjungan organik/bulan | ≥ 500 |

## 2.5 Ruang lingkup (scope)

### ✅ Termasuk (Fase 1 — MVP)

- Landing page brand + hero + highlight menu
- Halaman katalog menu 3 kategori (Taichan, Minuman, ChocoBerry)
- Detail produk (varian ukuran, add-on topping)
- Keranjang belanja (persist di `localStorage`)
- Form checkout (nama, WhatsApp, tipe order, alamat, catatan)
- Ringkasan pesanan + pilihan metode pembayaran
- Kirim pesanan ke WhatsApp admin dalam format terstruktur
- Halaman instruksi pembayaran QRIS
- Halaman "Tentang Kami" & kontak
- SEO dasar + Open Graph + WhatsApp preview

### ✅ Termasuk (Fase 2)

- Penyimpanan pesanan ke database
- Dashboard admin: daftar pesanan, ubah status, rekap harian
- Upload bukti pembayaran oleh pelanggan
- Toggle ketersediaan menu (habis/tersedia)

### 🚫 Tidak termasuk (out of scope untuk sekarang)

- Aplikasi mobile native
- Sistem membership / poin loyalitas
- Integrasi kurir otomatis (Gosend/Grab API)
- Multi-cabang / multi-outlet
- Payment gateway berbayar (dipertimbangkan di Fase 3)
- Multi-bahasa

## 2.6 Asumsi & batasan

| Kode | Asumsi / batasan |
|---|---|
| A-01 | Budget infrastruktur mendekati Rp0 → gunakan tier gratis (Vercel, Supabase free) |
| A-02 | Admin hanya 1–2 orang, tidak ada tim IT |
| A-03 | QRIS yang tersedia saat ini dihasilkan dari aplikasi merchant (DANA / BCA / GoPay) |
| A-04 | Area pengiriman terbatas radius sekitar dapur; ongkir ditentukan manual oleh admin |
| A-05 | Stok bahan terbatas → menu bisa habis sewaktu-waktu, butuh toggle ketersediaan |
| A-06 | Jam operasional belum final → tampilkan sebagai `TBD` sampai dikonfirmasi |

## 2.7 Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pesanan masuk saat tutup | Kecewa | Tampilkan status buka/tutup + jadwal |
| Pelanggan bayar tapi tidak konfirmasi | Selisih kas | Wajib upload bukti / kirim otomatis via WA |
| Menu habis tapi masih bisa dipesan | Komplain | Toggle "Habis" di admin (Fase 2) |
| Foto produk kurang menarik | Konversi rendah | Gunakan aset poster resmi di `assets/menu/` |
| Agent AI mengarang harga | Salah tagih | `data/menu.json` sebagai single source of truth |

---

➡️ Lanjut ke `03_PRD.md`
