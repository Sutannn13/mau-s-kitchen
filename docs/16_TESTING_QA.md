# 16 — Testing & QA

## 16.1 Strategi pengujian

| Lapisan   | Alat                     | Cakupan                                                               |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| Unit      | Vitest                   | Fungsi harga, format rupiah, generator kode pesanan, builder pesan WA |
| Komponen  | Vitest + Testing Library | MenuCard, QuantityStepper, CartSummary, CheckoutForm                  |
| Integrasi | Vitest                   | Route handler `/api/orders` (validasi & perhitungan)                  |
| E2E       | Playwright               | Alur pesan dari menu sampai halaman pembayaran                        |
| Manual    | Checklist di bawah       | Perangkat nyata, terutama HP Android                                  |

> Prioritas untuk MVP: **unit test pada logika harga** + **QA manual menyeluruh**.
> E2E ditambahkan setelah fitur stabil.

---

## 16.2 Unit test wajib (logika uang)

```ts
// lib/__tests__/pricing.test.ts
describe("lineSubtotal", () => {
  it("menghitung item tanpa varian dan tanpa add-on", () => {
    // Taichan Daging × 2
    expect(lineSubtotal({ unitPrice: 35000, addOns: [], quantity: 2 })).toBe(
      70000,
    );
  });

  it("menghitung varian Medium ChocoBerry Grape", () => {
    expect(lineSubtotal({ unitPrice: 40000, addOns: [], quantity: 1 })).toBe(
      40000,
    );
  });

  it("menambahkan add-on Pistacio Kunava per porsi", () => {
    // (40000 + 8000) × 2 = 96000
    expect(
      lineSubtotal({
        unitPrice: 40000,
        addOns: [
          { id: "pistacio-kunava", name: "Pistacio Kunava", price: 8000 },
        ],
        quantity: 2,
      }),
    ).toBe(96000);
  });
});

describe("formatRupiah", () => {
  it.each([
    [5000, "Rp5.000"],
    [35000, "Rp35.000"],
    [118000, "Rp118.000"],
    [1450000, "Rp1.450.000"],
  ])("memformat %i menjadi %s", (input, expected) => {
    expect(formatRupiah(input)).toBe(expected);
  });
});

describe("phoneSchema", () => {
  it.each(["081234567890", "6281234567890", "+6281234567890"])(
    "menerima %s",
    (v) => expect(phoneSchema.safeParse(v).success).toBe(true),
  );

  it.each(["12345", "0712345678", "08", "abcdefghij"])("menolak %s", (v) =>
    expect(phoneSchema.safeParse(v).success).toBe(false),
  );

  it("menormalkan 08xx menjadi 62xx", () => {
    expect(phoneSchema.parse("081234567890")).toBe("6281234567890");
  });
});

describe("buildOrderCode", () => {
  it("membuat format MK-YYMMDD-XXX", () => {
    expect(buildOrderCode(new Date("2026-08-14T12:00:00Z"), 7)).toBe(
      "MK-260814-007",
    );
  });
});
```

---

## 16.3 Skenario E2E (Playwright)

| ID     | Skenario                                                                           | Hasil yang diharapkan                                                                                   |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| E2E-01 | Buka `/menu` → tambah Taichan Daging → buka keranjang                              | Item muncul, total Rp35.000                                                                             |
| E2E-02 | Tambah ChocoBerry Grape Medium + Pistacio Kunava                                   | Subtotal Rp48.000                                                                                       |
| E2E-03 | Ubah jumlah 1 → 3 di keranjang                                                     | Total menjadi tiga kali lipat                                                                           |
| E2E-04 | Refresh halaman keranjang                                                          | Isi keranjang tetap ada                                                                                 |
| E2E-05 | Putuskan respons POST sesudah server menyimpan, lalu retry payload sama            | Hanya satu kode/order dibuat dan respons retry memakai order pertama                                    |
| E2E-06 | Admin A dan B membuka order BARU; A membatalkan, B mencoba memproses snapshot lama | B mendapat `409 ORDER_CONFLICT`, status tetap BATAL                                                     |
| E2E-07 | Buka "Pesanan Saya" setelah admin mengubah ongkir/status                           | Status dan total lokal tersinkron ke nilai server                                                       |
| E2E-08 | Hapus riwayat di perangkat bersama                                                 | Seluruh token guest hilang dari daftar lokal setelah konfirmasi dua langkah                             |
| E2E-09 | Update menu dengan varian/add-on invalid                                           | Header, varian, dan add-on lama tetap utuh (rollback)                                                   |
| E2E-10 | Supabase terkonfigurasi tetapi RPC checkout gagal                                  | API menolak checkout; tidak ada pesanan bayangan di RAM                                                 |
| E2E-11 | Buka dropdown status pada kartu tengah/bawah                                       | Menu tampil di atas seluruh kartu dan tetap di dalam viewport                                           |
| E2E-12 | QRIS belum memiliki aset resmi                                                     | Opsi QRIS nonaktif; pelanggan tidak diarahkan ke placeholder                                            |
| E2E-13 | Checkout tanpa mengisi nama                                                        | Muncul error "Nama minimal 2 karakter"                                                                  |
| E2E-14 | Checkout Ambil Sendiri                                                             | Ongkir Rp0 dan total langsung final; admin tidak melihat input ongkir                                   |
| E2E-15 | Checkout Antar QRIS sebelum rencana lengkap                                        | QRIS, klaim, dan upload bukti tersembunyi/ditolak `409 DELIVERY_PLAN_PENDING`                           |
| E2E-16 | Admin menyimpan ongkir Rp0 pada delivery                                           | Halaman pelanggan tetap refresh dan pembayaran aktif walau angka total sama                             |
| E2E-17 | Admin konfirmasi delivery tanpa rencana lengkap                                    | Tombol nonaktif dan API menolak `409 DELIVERY_PLAN_PENDING`                                             |
| E2E-18 | Ubah ongkir setelah klaim/bukti/status dikonfirmasi                                | UI terkunci dan API menolak `409 ORDER_FINANCIALS_LOCKED`                                               |
| E2E-19 | Admin menetapkan Antar Tunai dengan GoSend/GrabExpress                             | Opsi eksternal nonaktif dan API/DB menolak `COD_REQUIRES_INTERNAL_DELIVERY`                             |
| E2E-20 | Admin menetapkan pengantaran internal                                              | Biaya kurir aktual otomatis Rp0; ongkir pelanggan masuk total dan selisih menjadi margin                |
| E2E-21 | Admin menetapkan GoSend untuk pesanan QRIS                                         | Ongkir pelanggan dan biaya kurir aktual tersimpan terpisah; pelanggan hanya melihat provider dan ongkir |
| E2E-22 | Admin mencoba konfirmasi dengan provider/biaya parsial                             | Tombol nonaktif dan API/DB menolak rencana pengantaran parsial                                          |
| E2E-23 | Checkout tipe Antar tanpa alamat                                                   | Muncul error "Alamat wajib diisi untuk pesanan antar"                                                   |
| E2E-24 | Checkout dengan nomor WA `12345`                                                   | Muncul error "Nomor WhatsApp tidak valid"                                                               |
| E2E-25 | Checkout valid dengan QRIS yang sudah dikonfigurasi                                | Redirect ke `/pembayaran/MK-*`, kode pesanan tampil                                                     |
| E2E-26 | Buka `/checkout` dengan keranjang kosong                                           | Redirect ke `/menu`                                                                                     |
| E2E-27 | Buka `/admin/pesanan` tanpa login                                                  | Redirect ke `/admin/login`                                                                              |
| E2E-28 | Pilih bukti JPG/PNG/WebP asli di bawah 4MB                                         | Browser mendecode dan mengecilkan file; API menyimpan hasil maksimal 1MiB                               |
| E2E-29 | Kirim multipart hasil lebih dari 1MiB langsung ke API                              | API menolak `413 PAYLOAD_TOO_LARGE`; tidak ada objek Storage dibuat                                     |
| E2E-30 | Ganti nama/MIME file HTML menjadi `bukti.jpg`                                      | API menolak `400 VALIDATION_ERROR`; tidak ada objek Storage dibuat                                      |
| E2E-31 | Buka invoice pesanan BARU atau BATAL dengan token valid                            | Invoice belum tersedia dan tidak menampilkan rincian dokumen                                            |
| E2E-32 | Admin mengonfirmasi pesanan lalu pelanggan membuka invoice                         | Invoice memakai kode pesanan, total final, dan tombol cetak/PDF tampil                                  |
| E2E-33 | Cetak invoice dari mobile/desktop                                                  | Kontrol layar tersembunyi, layout A4 bersih, baris item tidak terpotong                                 |
| E2E-34 | Admin mengunduh rekap Excel                                                        | File `.xlsx` terbuka dengan sheet Ringkasan, Pesanan, dan Item Pesanan; KPI sesuai data server          |
| E2E-35 | Filter/sort tabel Pesanan di Excel                                                 | Header tetap terlihat, nilai tanggal/Rupiah dikenali sebagai tipe data, dan formula tidak rusak         |
| E2E-36 | Admin mengunduh CSV Mentah                                                         | CSV hanya berisi satu header dan tabel detail; input berawalan karakter formula tetap dinetralisasi     |

---

## 16.4 Checklist QA manual

### Fungsional

- [ ] Semua harga di website **persis sama** dengan `docs/05_MENU_CATALOG.md`
- [ ] Semua 11 item menu tampil di kategori yang benar
- [ ] ChocoBerry menampilkan pilihan Small & Medium
- [ ] Add-on Pistacio Kunava hanya muncul di ChocoBerry
- [ ] Lontong & Sambel Taichan bisa dipesan terpisah
- [ ] Badge keranjang menampilkan jumlah yang benar
- [ ] Item identik digabung, bukan dobel baris
- [ ] Item dengan catatan berbeda dianggap baris terpisah
- [ ] Total = subtotal + ongkir
- [ ] Ambil Sendiri selalu ongkir Rp0
- [ ] Delivery tidak bisa dibayar atau dikonfirmasi sebelum ongkir final
- [ ] Delivery tidak bisa dibayar atau dikonfirmasi sebelum provider dan biaya lengkap
- [ ] Tunai/COD Antar hanya dapat memakai pengantaran langsung MAU'S Kitchen
- [ ] Ongkir pelanggan dan biaya kurir aktual tersimpan serta tampil terpisah di admin/Excel/CSV
- [ ] Biaya kurir aktual tidak tampil pada endpoint atau halaman pelanggan
- [ ] Ongkir terkunci setelah pembayaran diklaim/bukti dikirim/status dikonfirmasi
- [ ] Kode pesanan unik dan tidak berulang
- [ ] Double submit/retry jaringan menghasilkan tepat satu pesanan
- [ ] "Pesanan Saya" menampilkan status dan total terbaru dari server
- [ ] Riwayat guest bisa dihapus dan entri >30 hari dipangkas
- [ ] Pesan WhatsApp terbentuk lengkap dan rapi
- [ ] Invoice hanya tersedia sejak DIKONFIRMASI dan tetap memakai token privat
- [ ] Ringkasan Excel merekonsiliasi jumlah pesanan, omzet SELESAI, dan rata-rata transaksi dengan layar admin
- [ ] Kolom `Cek Total` Excel bernilai Rp0 untuk seluruh pesanan valid
- [ ] Invoice tidak mengekspos biaya kurir aktual, margin, token, atau catatan admin

### Tampilan

- [ ] Tidak ada scroll horizontal di lebar 360px
- [ ] Teks terbaca di semua latar (kontras cukup)
- [ ] Gambar tidak gepeng / teregang
- [ ] Tombol tidak tertimpa bottom bar di mobile
- [ ] Bottom sheet bisa ditutup dengan swipe & tombol X
- [ ] Skeleton loading tampil, bukan layar putih kosong
- [ ] Ikon dan emoji tampil benar di Android maupun iOS

### Kompatibilitas perangkat

- [ ] Chrome Android (HP kelas menengah, bukan flagship)
- [ ] Safari iOS
- [ ] Chrome desktop
- [ ] Mode gelap sistem tidak merusak tampilan
- [ ] Koneksi 3G/4G lambat masih dapat digunakan

### Performa

- [ ] Lighthouse Mobile: Performance ≥ 85
- [ ] Lighthouse: Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 95
- [ ] LCP ≤ 2,5 detik
- [ ] Ukuran halaman utama ≤ 1,5MB

### Keamanan

- [ ] `/admin` tidak bisa diakses tanpa login
- [ ] Harga dihitung ulang di server, bukan dipercaya dari klien
- [ ] Tidak ada secret yang bocor di bundle browser
- [ ] Endpoint pesanan memiliki rate limit; `/api/orders/1` dan
      `/api/orders/2` berhenti `404` sebelum query database
- [ ] Payload `</script><script>...` pada data menu tetap inert di JSON-LD
- [ ] Update status bersamaan tidak dapat menimpa status final
- [ ] Replace varian/add-on gagal tanpa meninggalkan data parsial
- [ ] Unggahan bukti bayar dibatasi tipe dan ukuran; hasil maksimal 1MiB
- [ ] File HTML/EXE yang diganti ekstensi atau MIME menjadi gambar tetap ditolak

### Konten

- [ ] Tidak ada teks Lorem Ipsum tersisa
- [ ] Tidak ada placeholder `TBD` yang lolos ke produksi tanpa catatan
- [ ] Nomor WhatsApp benar: 0816-1769-1585
- [ ] Penulisan brand konsisten: **MAU'S Kitchen**
- [ ] Tidak ada typo pada nama menu (khususnya "Pistacio Kunava")

---

## 16.5 Kasus uji perhitungan harga (referensi manual)

| Kasus | Isi keranjang                                | Total yang benar |
| ----- | -------------------------------------------- | ---------------- |
| 1     | 1× Taichan Daging                            | Rp35.000         |
| 2     | 2× Taichan Kulit + 2× Lontong                | Rp80.000         |
| 3     | 1× ChocoBerry Original Small                 | Rp25.000         |
| 4     | 1× ChocoBerry Grape Medium + Pistacio        | Rp48.000         |
| 5     | 3× ChocoBerry Banana Small + Pistacio        | Rp99.000         |
| 6     | 2× Taichan Daging + 2× Thai Tea + 2× Lontong | Rp114.000        |
| 7     | 1× Teh Original + 1× Sambel Taichan          | Rp15.000         |
| 8     | 4× Aren Latte                                | Rp68.000         |

---

## 16.6 Definition of Done rilis

Rilis produksi hanya boleh dilakukan jika:

- [ ] Seluruh checklist QA fungsional lolos
- [ ] `npm run build` sukses tanpa error maupun warning tipe
- [ ] Target Lighthouse tercapai
- [ ] Diuji langsung di minimal 2 HP fisik berbeda
- [ ] Pemilik usaha sudah meninjau harga dan menyetujui
- [ ] Nomor WhatsApp dan QRIS sudah diverifikasi benar
- [ ] Dokumentasi di `docs/` sudah diperbarui sesuai implementasi

---

➡️ Lanjut ke `17_DEPLOYMENT.md`

## 16.7 Gate keamanan produksi

- Jalankan `npm run security:preflight` dengan environment produksi.
- Uji akun terautentikasi yang tidak ada di allowlist: seluruh halaman/API admin
  harus ditolak.
- Akses status, pembayaran, dan upload tanpa token atau dengan token salah harus
  menghasilkan `404`.
- File HTML yang memakai MIME gambar harus ditolak; upload kedua harus `409`.
- `npm audit --omit=dev` wajib menghasilkan nol vulnerability sebelum rilis.
