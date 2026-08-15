# 16 — Testing & QA

## 16.1 Strategi pengujian

| Lapisan | Alat | Cakupan |
|---|---|---|
| Unit | Vitest | Fungsi harga, format rupiah, generator kode pesanan, builder pesan WA |
| Komponen | Vitest + Testing Library | MenuCard, QuantityStepper, CartSummary, CheckoutForm |
| Integrasi | Vitest | Route handler `/api/orders` (validasi & perhitungan) |
| E2E | Playwright | Alur pesan dari menu sampai halaman pembayaran |
| Manual | Checklist di bawah | Perangkat nyata, terutama HP Android |

> Prioritas untuk MVP: **unit test pada logika harga** + **QA manual menyeluruh**.
> E2E ditambahkan setelah fitur stabil.

---

## 16.2 Unit test wajib (logika uang)

```ts
// lib/__tests__/pricing.test.ts
describe("lineSubtotal", () => {
  it("menghitung item tanpa varian dan tanpa add-on", () => {
    // Taichan Daging × 2
    expect(lineSubtotal({ unitPrice: 35000, addOns: [], quantity: 2 })).toBe(70000)
  })

  it("menghitung varian Medium ChocoBerry Grape", () => {
    expect(lineSubtotal({ unitPrice: 40000, addOns: [], quantity: 1 })).toBe(40000)
  })

  it("menambahkan add-on Pistacio Kunava per porsi", () => {
    // (40000 + 8000) × 2 = 96000
    expect(
      lineSubtotal({
        unitPrice: 40000,
        addOns: [{ id: "pistacio-kunava", name: "Pistacio Kunava", price: 8000 }],
        quantity: 2,
      }),
    ).toBe(96000)
  })
})

describe("formatRupiah", () => {
  it.each([
    [5000, "Rp5.000"],
    [35000, "Rp35.000"],
    [118000, "Rp118.000"],
    [1450000, "Rp1.450.000"],
  ])("memformat %i menjadi %s", (input, expected) => {
    expect(formatRupiah(input)).toBe(expected)
  })
})

describe("phoneSchema", () => {
  it.each(["081234567890", "6281234567890", "+6281234567890"])(
    "menerima %s", (v) => expect(phoneSchema.safeParse(v).success).toBe(true))

  it.each(["12345", "0712345678", "08", "abcdefghij"])(
    "menolak %s", (v) => expect(phoneSchema.safeParse(v).success).toBe(false))

  it("menormalkan 08xx menjadi 62xx", () => {
    expect(phoneSchema.parse("081234567890")).toBe("6281234567890")
  })
})

describe("buildOrderCode", () => {
  it("membuat format MK-YYMMDD-XXX", () => {
    expect(buildOrderCode(new Date("2026-08-14T12:00:00Z"), 7)).toBe("MK-260814-007")
  })
})
```

---

## 16.3 Skenario E2E (Playwright)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| E2E-01 | Buka `/menu` → tambah Taichan Daging → buka keranjang | Item muncul, total Rp35.000 |
| E2E-02 | Tambah ChocoBerry Grape Medium + Pistacio Kunava | Subtotal Rp48.000 |
| E2E-03 | Ubah jumlah 1 → 3 di keranjang | Total menjadi tiga kali lipat |
| E2E-04 | Refresh halaman keranjang | Isi keranjang tetap ada |
| E2E-05 | Checkout tanpa mengisi nama | Muncul error "Nama minimal 2 karakter" |
| E2E-06 | Checkout tipe Antar tanpa alamat | Muncul error "Alamat wajib diisi untuk pesanan antar" |
| E2E-07 | Checkout dengan nomor WA `12345` | Muncul error "Nomor WhatsApp tidak valid" |
| E2E-08 | Checkout valid dengan QRIS | Redirect ke `/pembayaran/MK-*`, kode pesanan tampil |
| E2E-09 | Buka `/checkout` dengan keranjang kosong | Redirect ke `/menu` |
| E2E-10 | Buka `/admin/pesanan` tanpa login | Redirect ke `/admin/login` |

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
- [ ] Kode pesanan unik dan tidak berulang
- [ ] Pesan WhatsApp terbentuk lengkap dan rapi

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
- [ ] Endpoint pesanan memiliki rate limit
- [ ] Unggahan bukti bayar dibatasi tipe & ukuran file

### Konten

- [ ] Tidak ada teks Lorem Ipsum tersisa
- [ ] Tidak ada placeholder `TBD` yang lolos ke produksi tanpa catatan
- [ ] Nomor WhatsApp benar: 0816-1769-1585
- [ ] Penulisan brand konsisten: **MAU'S Kitchen**
- [ ] Tidak ada typo pada nama menu (khususnya "Pistacio Kunava")

---

## 16.5 Kasus uji perhitungan harga (referensi manual)

| Kasus | Isi keranjang | Total yang benar |
|---|---|---|
| 1 | 1× Taichan Daging | Rp35.000 |
| 2 | 2× Taichan Kulit + 2× Lontong | Rp80.000 |
| 3 | 1× ChocoBerry Original Small | Rp25.000 |
| 4 | 1× ChocoBerry Grape Medium + Pistacio | Rp48.000 |
| 5 | 3× ChocoBerry Banana Small + Pistacio | Rp99.000 |
| 6 | 2× Taichan Daging + 2× Thai Tea + 2× Lontong | Rp114.000 |
| 7 | 1× Teh Original + 1× Sambel Taichan | Rp15.000 |
| 8 | 4× Aren Latte | Rp68.000 |

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
