# 03 — PRD (Product Requirements Document)

Versi: 1.0 · Status: Draft siap implementasi

---

## 3.1 Kebutuhan fungsional (Functional Requirements)

Kode: `FR-xx` · Prioritas: **P0** wajib MVP, **P1** penting, **P2** nice to have

| Kode  | Kebutuhan                                                                                                                                                        | Prioritas |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-01 | Menampilkan landing page dengan hero, highlight 3 lini produk, dan CTA "Pesan Sekarang"                                                                          | P0        |
| FR-02 | Menampilkan katalog menu yang dikelompokkan per kategori: Taichan, Minuman, ChocoBerry                                                                           | P0        |
| FR-03 | Setiap item menu menampilkan nama, deskripsi, foto, dan harga                                                                                                    | P0        |
| FR-04 | Item dengan varian ukuran (Small/Medium) menampilkan harga per ukuran                                                                                            | P0        |
| FR-05 | Item ChocoBerry dapat menambahkan add-on topping **Pistacio Kunava (+Rp8.000)**                                                                                  | P0        |
| FR-06 | Pelanggan dapat menambahkan item ke keranjang beserta jumlah, varian, add-on, dan catatan                                                                        | P0        |
| FR-07 | Keranjang menampilkan subtotal per item dan total keseluruhan                                                                                                    | P0        |
| FR-08 | Keranjang bertahan setelah halaman di-refresh (`localStorage`)                                                                                                   | P0        |
| FR-09 | Pelanggan dapat mengubah jumlah atau menghapus item dari keranjang                                                                                               | P0        |
| FR-10 | Form checkout: nama, nomor WhatsApp, tipe pesanan (Antar / Ambil Sendiri), alamat (jika antar), waktu pesanan, catatan                                           | P0        |
| FR-11 | Validasi form: nama wajib, nomor WA wajib & format Indonesia valid, alamat wajib jika tipe = Antar                                                               | P0        |
| FR-12 | Pelanggan memilih metode pembayaran: QRIS (DANA/BCA/GoPay), Transfer Bank, atau Tunai/COD                                                                        | P0        |
| FR-13 | Sistem membuat **kode pesanan unik** (format `MK-YYMMDD-XXX`)                                                                                                    | P0        |
| FR-14 | Sistem menyimpan **ringkasan pesanan terstruktur** untuk dashboard admin; WhatsApp hanya dibuka saat pelanggan memilih aksi WhatsApp secara eksplisit            | P0        |
| FR-15 | Halaman instruksi pembayaran QRIS dengan gambar QR, nominal, dan tombol "Sudah Bayar"                                                                            | P0        |
| FR-16 | Halaman "Pesanan Berhasil" berisi kode pesanan dan langkah selanjutnya                                                                                           | P0        |
| FR-17 | Halaman "Tentang Kami" berisi cerita brand & kontak                                                                                                              | P1        |
| FR-18 | Tombol WhatsApp mengambang (floating) di semua halaman                                                                                                           | P1        |
| FR-19 | Indikator status toko **Buka / Tutup** berdasarkan jam operasional                                                                                               | P1        |
| FR-20 | Menu dapat ditandai **Habis** dan tidak bisa ditambahkan ke keranjang                                                                                            | P1        |
| FR-21 | Pesanan tersimpan di database saat checkout                                                                                                                      | P1        |
| FR-22 | Dashboard admin menampilkan daftar pesanan beserta detail                                                                                                        | P1        |
| FR-23 | Admin dapat mengubah status pesanan: Baru → Dikonfirmasi → Diproses → Dikirim → Selesai / Batal                                                                  | P1        |
| FR-24 | Admin dapat melihat rekap penjualan harian (jumlah pesanan & total omzet)                                                                                        | P1        |
| FR-25 | Pelanggan dapat mengunggah bukti pembayaran                                                                                                                      | P2        |
| FR-26 | Pencarian & filter menu                                                                                                                                          | P2        |
| FR-27 | Admin dapat mengubah harga dan menambah menu dari dashboard                                                                                                      | P2        |
| FR-28 | Halaman testimoni / galeri pelanggan                                                                                                                             | P2        |
| FR-29 | Invoice privat tersedia setelah pesanan dikonfirmasi dan dapat dicetak/disimpan PDF                                                                              | P1        |
| FR-30 | Admin dapat mengunduh rekap Excel bermerek dengan ringkasan formula, tabel pesanan/item berfilter, dan format Rupiah/WIB; CSV tetap tersedia sebagai data mentah | P1        |

---

## 3.2 Kebutuhan non-fungsional (Non-Functional Requirements)

| Kode   | Kategori        | Kebutuhan                                                                       | Target                       |
| ------ | --------------- | ------------------------------------------------------------------------------- | ---------------------------- |
| NFR-01 | Performa        | Largest Contentful Paint di 4G                                                  | ≤ 2,5 detik                  |
| NFR-02 | Performa        | Ukuran halaman utama                                                            | ≤ 1,5 MB                     |
| NFR-03 | Performa        | Lighthouse Mobile Performance                                                   | ≥ 85                         |
| NFR-04 | Aksesibilitas   | Lighthouse Accessibility                                                        | ≥ 90                         |
| NFR-05 | Aksesibilitas   | Kontras teks minimum                                                            | WCAG AA (4.5:1)              |
| NFR-06 | Responsif       | Wajib berfungsi baik pada lebar 360px – 1440px                                  | 100% halaman                 |
| NFR-07 | Kompatibilitas  | Chrome Android, Safari iOS, Chrome/Edge desktop (2 versi terakhir)              | —                            |
| NFR-08 | Keamanan        | Semua secret di environment variable, tidak di repo                             | —                            |
| NFR-09 | Keamanan        | Route `/admin` wajib terproteksi autentikasi                                    | —                            |
| NFR-10 | Keamanan        | Validasi input di sisi server (bukan hanya client)                              | —                            |
| NFR-11 | Privasi         | Hanya simpan nama, nomor WA, alamat pengiriman. Tidak menyimpan data pembayaran | —                            |
| NFR-12 | Biaya           | Total biaya operasional bulanan                                                 | ≤ Rp0 (tier gratis) + domain |
| NFR-13 | Maintainability | Semua data menu terpusat di `data/menu.json`                                    | —                            |
| NFR-14 | SEO             | Metadata, Open Graph, JSON-LD `Restaurant` terpasang                            | —                            |
| NFR-15 | Ketersediaan    | Uptime                                                                          | ≥ 99%                        |

---

## 3.3 User stories & acceptance criteria

### US-01 — Melihat menu

> **Sebagai** calon pelanggan,
> **saya ingin** melihat seluruh menu beserta harganya,
> **agar** saya bisa memutuskan pesanan tanpa harus bertanya ke admin.

**Acceptance Criteria**

- [ ] Halaman `/menu` menampilkan 3 kategori: Taichan, Minuman, ChocoBerry
- [ ] Setiap item menampilkan nama, deskripsi singkat, foto, dan harga
- [ ] Item dengan dua ukuran menampilkan keduanya (contoh: `Small Rp25.000 · Medium Rp35.000`)
- [ ] Harga yang tampil identik dengan `data/menu.json`
- [ ] Halaman terbaca nyaman di layar 360px tanpa scroll horizontal

---

### US-02 — Menambah item ke keranjang

> **Sebagai** pelanggan,
> **saya ingin** menambahkan menu ke keranjang dengan varian dan jumlah tertentu,
> **agar** saya bisa memesan beberapa item sekaligus.

**Acceptance Criteria**

- [ ] Tombol "Tambah" tersedia di setiap kartu menu
- [ ] Untuk item bervarian, pengguna wajib memilih ukuran sebelum bisa menambah
- [ ] Untuk ChocoBerry, add-on Pistacio Kunava dapat dicentang (+Rp8.000/porsi)
- [ ] Ikon keranjang menampilkan jumlah item secara real-time
- [ ] Item yang sama dengan varian & add-on identik digabung jumlahnya, bukan duplikat baris
- [ ] Isi keranjang tetap ada setelah halaman di-refresh

---

### US-03 — Menghitung total belanja

> **Sebagai** pelanggan,
> **saya ingin** melihat rincian total yang harus dibayar,
> **agar** saya tahu persis nominalnya sebelum membayar.

**Acceptance Criteria**

- [ ] Subtotal item = (harga varian + total add-on) × jumlah
- [ ] Total = jumlah seluruh subtotal + ongkir (jika Antar)
- [ ] Format harga `Rp25.000` (pemisah ribuan titik, tanpa desimal)
- [ ] Jika ongkir belum ditentukan, tampilkan `Ongkir: dikonfirmasi admin`

---

### US-04 — Checkout

> **Sebagai** pelanggan,
> **saya ingin** mengisi data pemesanan dengan cepat,
> **agar** pesanan saya bisa segera diproses.

**Acceptance Criteria**

- [ ] Field: Nama, Nomor WhatsApp, Tipe Pesanan, Alamat (kondisional), Waktu, Catatan
- [ ] Nomor WhatsApp divalidasi format Indonesia (`08xx`, `+628xx`, atau `628xx`)
- [ ] Alamat menjadi wajib hanya jika Tipe Pesanan = "Antar"
- [ ] Pesan error ditampilkan dalam Bahasa Indonesia yang jelas
- [ ] Tombol submit nonaktif selama proses pengiriman untuk mencegah pesanan ganda
- [ ] Sistem menghasilkan kode pesanan format `MK-YYMMDD-XXX`

---

### US-05 — Membayar dengan QRIS

> **Sebagai** pelanggan,
> **saya ingin** membayar lewat QRIS dari DANA / BCA / GoPay,
> **agar** saya tidak perlu menyiapkan uang tunai.

**Acceptance Criteria**

- [ ] Halaman pembayaran menampilkan kode pesanan dan nominal total
- [ ] QRIS ditampilkan cukup besar dan mudah dipindai di layar HP
- [ ] Tercantum keterangan bahwa QRIS dapat dibayar dari aplikasi apa pun (DANA, GoPay, OVO, ShopeePay, m-banking)
- [ ] Ada tombol "Saya Sudah Bayar" yang mengirim konfirmasi ke WhatsApp admin
- [ ] Ada instruksi untuk mengirim bukti transfer

---

### US-06 — Menyimpan pesanan tanpa pengalihan WhatsApp

> **Sebagai** pelanggan,
> **saya ingin** pesanan langsung tersimpan dan lanjut ke instruksi berikutnya,
> **agar** checkout tidak membuka tab atau mengalihkan saya ke WhatsApp.

**Acceptance Criteria**

- [ ] Tombol "Buat Pesanan" tidak membuka tab atau aplikasi WhatsApp
- [ ] Pesanan tetap tersimpan di database dan muncul di dashboard admin
- [ ] Setelah berhasil, pelanggan diarahkan ke halaman pembayaran/status yang sesuai
- [ ] Deeplink WhatsApp tetap tersedia hanya pada tombol WhatsApp yang dipilih secara eksplisit oleh pelanggan

---

### US-07 — Admin mengelola pesanan

> **Sebagai** admin,
> **saya ingin** melihat dan memperbarui status pesanan,
> **agar** saya tidak kehilangan jejak pesanan yang masuk.

**Acceptance Criteria**

- [ ] `/admin` hanya bisa diakses setelah login
- [ ] Daftar pesanan diurutkan dari yang terbaru
- [ ] Setiap pesanan menampilkan kode, waktu, pelanggan, item, total, metode bayar, status
- [ ] Status dapat diubah: Baru → Dikonfirmasi → Diproses → Dikirim → Selesai (atau Batal)
- [ ] Ada filter berdasarkan status dan tanggal
- [ ] Tersedia ringkasan harian: jumlah pesanan dan total omzet

---

### US-08 — Menandai menu habis

> **Sebagai** admin,
> **saya ingin** menandai menu yang stoknya habis,
> **agar** pelanggan tidak memesan barang yang tidak tersedia.

**Acceptance Criteria**

- [ ] Toggle ketersediaan tersedia di dashboard admin
- [ ] Menu berstatus habis tampil dengan label "Habis" dan tombol tambah nonaktif
- [ ] Perubahan tampil di sisi pelanggan maksimal 60 detik

---

## 3.4 Aturan bisnis

| Kode  | Aturan                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Harga yang ditampilkan sudah termasuk pajak; tidak ada penambahan pajak di checkout                                                                                             |
| BR-02 | Add-on Pistacio Kunava hanya berlaku untuk kategori ChocoBerry                                                                                                                  |
| BR-03 | Lontong dan Sambel Taichan adalah item tambahan mandiri, dapat dipesan terpisah                                                                                                 |
| BR-04 | Minimum order untuk pengiriman: `TBD` (dikonfirmasi pemilik)                                                                                                                    |
| BR-05 | Ambil Sendiri selalu ongkir Rp0. Untuk Antar, admin menentukan pengantar dan ongkir manual; pelanggan hanya boleh membayar setelah rencana pengantaran dan total akhir tersedia |
| BR-06 | Pesanan dianggap sah setelah dikonfirmasi admin lewat WhatsApp                                                                                                                  |
| BR-07 | Pembatalan hanya bisa dilakukan sebelum status "Diproses"                                                                                                                       |
| BR-08 | Kode pesanan tidak boleh dipakai ulang                                                                                                                                          |
| BR-09 | Tipe Antar tidak berarti COD. Tunai/COD untuk Antar hanya boleh memakai pengantaran langsung MAU'S Kitchen                                                                      |
| BR-10 | Ongkir pelanggan dan biaya kurir aktual dicatat terpisah; selisih positif adalah margin pengantaran dan selisih negatif adalah subsidi usaha                                    |

---

➡️ Lanjut ke `04_BUSINESS_FLOW.md`
