# 05 — Menu Catalog (Source of Truth)

> ⚠️ **PENTING:** Dokumen ini dan `data/menu.json` adalah **satu-satunya sumber kebenaran**
> untuk nama menu, deskripsi, dan harga. AI coding agent **dilarang** mengarang atau mengubah
> data di luar dokumen ini.
>
> Semua harga diambil langsung dari poster resmi MAU'S Kitchen
> (lihat `assets/menu/`). Harga dalam Rupiah, sudah termasuk pajak.

---

## 5.1 Kategori 1 — TAICHAN

**Tagline:** *Pedesnya nampol, rasanya nagih!*
**Sumber:** `assets/menu/menu-taichan.jpeg`

### Menu utama

| ID | Nama | Deskripsi | Harga |
|---|---|---|---|
| `taichan-daging` | Taichan Daging | Sate ayam bagian daging, dibakar tanpa bumbu kacang, disajikan dengan sambal taichan pedas dan jeruk nipis | **Rp35.000** |
| `taichan-kulit` | Taichan Kulit | Sate kulit ayam renyah dibakar, gurih di luar juicy di dalam, dengan sambal taichan khas | **Rp35.000** |

### Tambahan

| ID | Nama | Deskripsi | Harga |
|---|---|---|---|
| `lontong` | Lontong | Lontong pulen, pendamping pas untuk taichan | **Rp5.000** |
| `sambel-taichan` | Sambel Taichan | Sambal taichan ekstra, pedas segar khas MAU'S Kitchen | **Rp5.000** |

---

## 5.2 Kategori 2 — MINUMAN

**Tagline:** *Pedesnya nampol, rasanya nagih!*
**Sumber:** `assets/menu/menu-minuman.jpeg`

| ID | Nama | Deskripsi | Harga |
|---|---|---|---|
| `teh-original` | Teh Original | Es teh original segar, manisnya pas untuk menemani taichan pedas | **Rp10.000** |
| `thai-tea` | Thai Tea | Thai tea creamy dengan aroma teh Thailand yang khas | **Rp17.000** |
| `teh-susu` | Teh Susu | Perpaduan teh pilihan dan susu, lembut dan bikin nagih | **Rp17.000** |
| `aren-latte` | Aren Latte | Kopi susu gula aren dengan manis alami khas gula aren asli | **Rp17.000** |

> **Catatan pemilik:** varian **Lemon Tea** dan **Susu Strawberry** pernah dijual namun
> **tidak ada di poster menu terbaru**. Status: `ARSIP / TIDAK AKTIF`.
> Jangan ditampilkan di website sampai pemilik mengonfirmasi ulang harga dan ketersediaannya.

---

## 5.3 Kategori 3 — CHOCOBERRY

**Sub-brand:** ChocoBerry by Mau's Kitchen
**Tagline:** *Fresh Berries, Premium Chocolate* · *Made with Love, Just for You*
**Sumber:** `assets/menu/menu-chocoberry.jpeg`

| ID | Nama | Deskripsi | Small | Medium |
|---|---|---|---|---|
| `choco-berry-original` | Choco Berry Original | Strawberry segar disiram coklat premium yang lumer | **Rp25.000** | **Rp35.000** |
| `choco-berry-grape` | Choco Berry Grape | Strawberry & anggur segar disiram coklat premium yang lumer | **Rp30.000** | **Rp40.000** |
| `choco-berry-banana` | Choco Berry Banana | Strawberry & pisang segar disiram coklat premium yang lumer | **Rp25.000** | **Rp35.000** |

### Add-on topping

| ID | Nama | Deskripsi | Harga | Berlaku untuk |
|---|---|---|---|---|
| `pistacio-kunava` | Pistacio Kunava | Topping pistachio kunafa renyah & gurih yang sempurna | **+Rp8.000** | Semua varian ChocoBerry |

---

## 5.4 Tabel harga cepat (quick reference)

| Produk | Harga |
|---|---|
| Taichan Daging | Rp35.000 |
| Taichan Kulit | Rp35.000 |
| Lontong | Rp5.000 |
| Sambel Taichan | Rp5.000 |
| Teh Original | Rp10.000 |
| Thai Tea | Rp17.000 |
| Teh Susu | Rp17.000 |
| Aren Latte | Rp17.000 |
| Choco Berry Original — S / M | Rp25.000 / Rp35.000 |
| Choco Berry Grape — S / M | Rp30.000 / Rp40.000 |
| Choco Berry Banana — S / M | Rp25.000 / Rp35.000 |
| Add-on Pistacio Kunava | +Rp8.000 |

**Harga terendah:** Rp5.000 · **Harga tertinggi:** Rp48.000 (Grape Medium + Pistacio Kunava)

---

## 5.5 Paket rekomendasi (untuk upselling di website)

> Paket ini **saran marketing**, harga = penjumlahan item. Konfirmasi ke pemilik sebelum
> menampilkan diskon apa pun.

| Nama paket | Isi | Total |
|---|---|---|
| Paket Nampol | Taichan Daging + Lontong + Teh Original | Rp50.000 |
| Paket Berdua | 2× Taichan Daging + 2× Thai Tea + 2× Lontong | Rp114.000 |
| Paket Manis Pedas | Taichan Kulit + Choco Berry Original (S) + Aren Latte | Rp77.000 |
| Paket Dessert Duo | 2× Choco Berry Grape (M) + 2× Pistacio Kunava | Rp96.000 |

---

## 5.6 Aturan implementasi untuk developer / AI agent

1. **Jangan hardcode harga** di komponen React. Selalu baca dari `data/menu.json`.
2. Struktur harga menggunakan **integer rupiah** (contoh `35000`), bukan string, bukan desimal.
3. Format tampilan menggunakan helper:
   ```ts
   export const formatRupiah = (n: number) =>
     new Intl.NumberFormat("id-ID", {
       style: "currency",
       currency: "IDR",
       minimumFractionDigits: 0,
     }).format(n) // → "Rp35.000"
   ```
4. Item dengan `variants` **wajib** memilih varian sebelum masuk keranjang.
5. Add-on hanya boleh muncul pada item yang `addOns`-nya tidak kosong.
6. Jika ada perubahan harga: ubah `data/menu.json` **dan** dokumen ini, lalu naikkan `version`.

---

## 5.7 Riwayat versi menu

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 14 Agustus 2026 | Versi awal, diambil dari poster resmi Taichan, Minuman, dan ChocoBerry |

---

➡️ Lanjut ke `06_BRAND_GUIDELINE.md`
