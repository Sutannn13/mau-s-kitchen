# 06 — Brand Guideline

Panduan identitas visual & verbal MAU'S Kitchen untuk website.
Semua nilai warna di bawah diambil dari aset resmi di `assets/`.

---

## 6.1 Logo

| Item | Keterangan |
|---|---|
| File | `assets/brand/logo-maus-kitchen.jpeg` |
| Bentuk | Lingkaran, latar krem, bingkai emas, ornamen daun & floral |
| Elemen | Ranting daun coklat tua, ornamen floral pink, wordmark serif "Mau's Kitchen" |
| Sub-teks | `HOMEMADE WITH LOVE` · ikon WhatsApp + `081617691585` |
| Penulisan nama | **MAU'S Kitchen** (apostrof wajib). Jangan tulis `Maus Kitchen` atau `MAUS KITCHEN` |
| Clear space | Minimal 10% dari diameter logo di semua sisi |
| Ukuran minimum | 48px (favicon 32px versi sederhana) |

**Dilarang:** meregangkan logo, mengubah warna, menambah bayangan berlebih, menaruh di latar ramai tanpa lapisan gelap.

---

## 6.2 Palet warna

### Palet utama (identitas induk — elegan & hangat)

| Token | Hex | Penggunaan |
|---|---|---|
| `--cream` | `#F7EEE4` | Latar utama halaman |
| `--cream-soft` | `#FBF6F0` | Latar kartu / section terang |
| `--brown-deep` | `#3E2318` | Teks utama, footer |
| `--brown` | `#5C3A24` | Judul, wordmark |
| `--gold` | `#C79A4B` | Aksen garis, bingkai, harga |
| `--gold-light` | `#E3C489` | Hover aksen emas |
| `--rose` | `#E8AFA4` | Ornamen floral, badge lembut |

### Palet Taichan & Minuman (energik & berani)

| Token | Hex | Penggunaan |
|---|---|---|
| `--ink` | `#0F0F0F` | Latar section Taichan/Minuman |
| `--ink-soft` | `#1C1B19` | Kartu di atas latar gelap |
| `--chili-red` | `#D62828` | Label kategori, badge "Pedas" |
| `--flame-yellow` | `#F4B01A` | Harga, heading, CTA di latar gelap |
| `--white` | `#FFFFFF` | Teks di latar gelap |

### Palet ChocoBerry (dessert premium)

| Token | Hex | Penggunaan |
|---|---|---|
| `--choco` | `#2A1A12` | Latar section ChocoBerry |
| `--choco-mid` | `#6B4226` | Gradien coklat |
| `--berry` | `#C0392B` | Aksen strawberry |
| `--pistachio` | `#8A9A3B` | Aksen topping pistacio kunava |

### Warna semantik

| Token | Hex | Arti |
|---|---|---|
| `--success` | `#2E7D32` | Berhasil, toko buka |
| `--warning` | `#ED8936` | Peringatan, stok menipis |
| `--danger` | `#C53030` | Error, menu habis, toko tutup |
| `--info` | `#2B6CB0` | Informasi netral |

### Tailwind config (siap tempel)

```ts
// tailwind.config.ts — theme.extend.colors
colors: {
  cream:      { DEFAULT: "#F7EEE4", soft: "#FBF6F0" },
  brown:      { DEFAULT: "#5C3A24", deep: "#3E2318" },
  gold:       { DEFAULT: "#C79A4B", light: "#E3C489" },
  rose:       { DEFAULT: "#E8AFA4" },
  ink:        { DEFAULT: "#0F0F0F", soft: "#1C1B19" },
  chili:      { DEFAULT: "#D62828" },
  flame:      { DEFAULT: "#F4B01A" },
  choco:      { DEFAULT: "#2A1A12", mid: "#6B4226" },
  berry:      { DEFAULT: "#C0392B" },
  pistachio:  { DEFAULT: "#8A9A3B" },
}
```

---

## 6.3 Tipografi

| Peran | Font | Alternatif | Keterangan |
|---|---|---|---|
| Display / wordmark | **Playfair Display** | Cormorant Garamond | Serif elegan, mendekati logo |
| Heading Taichan/Minuman | **Bebas Neue** atau **Anton** | Oswald | Kapital, tegas, sesuai poster |
| Body | **Plus Jakarta Sans** | Inter | Modern, mudah dibaca, lokal Indonesia |
| Angka harga | **Plus Jakarta Sans** (600/700) | — | Tabular numbers |

### Skala tipografi

| Elemen | Mobile | Desktop | Bobot |
|---|---|---|---|
| H1 | 30px | 52px | 700 |
| H2 | 24px | 36px | 700 |
| H3 | 20px | 26px | 600 |
| Body | 15px | 16px | 400 |
| Small / caption | 13px | 14px | 400 |
| Harga | 18px | 20px | 700 |

Gunakan `next/font/google` agar font ter-host sendiri dan tidak memperlambat halaman.

---

## 6.4 Gaya visual

| Aspek | Aturan |
|---|---|
| Sudut membulat | `rounded-2xl` (16px) untuk kartu, `rounded-full` untuk tombol utama |
| Bayangan | Halus dan hangat: `0 4px 20px rgba(62,35,24,0.08)` |
| Border | 1px `--gold` dengan opasitas 30–40% untuk kartu premium |
| Ikon | Lucide React, `stroke-width: 1.75` |
| Foto produk | Rasio 4:5 (potret) untuk kartu, 16:9 untuk hero |
| Animasi | Halus dan singkat (150–250ms). Hormati `prefers-reduced-motion` |
| Spasi | Kelipatan 4px. Padding section: 48px mobile, 96px desktop |

### Aturan pembagian warna per section

```
Hero & Tentang Kami     → latar cream, teks brown-deep, aksen gold
Section Taichan         → latar ink, teks putih, aksen chili + flame
Section Minuman         → latar ink, teks putih, aksen flame
Section ChocoBerry      → latar choco (gradien), teks cream, aksen gold + berry
Footer                  → latar brown-deep, teks cream
```

---

## 6.5 Tone of voice

| Prinsip | Penjelasan |
|---|---|
| Hangat & personal | Seperti masakan rumah, bukan korporat |
| Santai tapi sopan | Gunakan "kamu", hindari bahasa terlalu formal |
| Antusias, tidak lebay | Boleh main kata, tapi jangan berlebihan |
| Jujur | Jangan janjikan waktu antar yang tidak realistis |

### Contoh penerapan

| Konteks | ✅ Tulis begini | ❌ Jangan begini |
|---|---|---|
| CTA utama | "Pesan Sekarang" | "Submit Order" |
| Keranjang kosong | "Keranjang kamu masih kosong. Yuk pilih menu favoritmu!" | "Cart is empty" |
| Menu habis | "Lagi habis, coba besok ya 🙏" | "Out of stock" |
| Berhasil | "Pesanan kamu sudah kami terima! 🎉" | "Order created successfully" |
| Error | "Nomor WhatsApp-nya belum benar nih" | "Invalid phone number format" |
| Toko tutup | "Lagi tutup. Buka lagi besok jam TBD, bisa pre-order kok!" | "Store closed" |

### Frasa brand yang boleh dipakai

- "Homemade with Love"
- "Pedesnya nampol, rasanya nagih!" (Taichan & Minuman)
- "Fresh Berries, Premium Chocolate" (ChocoBerry)
- "Made with Love, Just for You" (ChocoBerry)

---

## 6.6 Penggunaan emoji

Boleh, secukupnya, dan konsisten:

| Konteks | Emoji |
|---|---|
| Taichan | 🍢 🔥 |
| Minuman | 🧋 🧋 |
| ChocoBerry | 🍓 🍫 |
| Pesanan | 🛒 🍽️ |
| Pembayaran | 💳 |
| WhatsApp | 💬 |

Maksimal 1 emoji per judul, 2 per pesan WhatsApp per baris.

---

➡️ Lanjut ke `07_INFORMATION_ARCHITECTURE.md`
