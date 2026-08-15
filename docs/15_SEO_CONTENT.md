# 15 — SEO & Content

## 15.1 Target kata kunci

| Prioritas | Kata kunci | Maksud pencarian |
|---|---|---|
| Utama | `mau's kitchen`, `maus kitchen` | Brand |
| Utama | `sate taichan [nama kota]` | Lokal |
| Utama | `taichan delivery` | Transaksional |
| Pendukung | `chocoberry`, `strawberry coklat cup` | Produk dessert |
| Pendukung | `pesan taichan online` | Transaksional |
| Pendukung | `thai tea murah [nama kota]` | Minuman |
| Ekor panjang | `taichan enak dekat sini`, `dessert buah coklat cup terdekat` | Lokal |

> Ganti `[nama kota]` dengan lokasi asli usaha setelah dikonfirmasi pemilik.

---

## 15.2 Metadata per halaman

| Halaman | Title (≤ 60 karakter) | Description (≤ 155 karakter) |
|---|---|---|
| `/` | MAU'S Kitchen — Taichan, Minuman & ChocoBerry | Sate taichan pedas, minuman segar, dan ChocoBerry buah coklat premium. Pesan online, bayar QRIS. Homemade with Love. |
| `/menu` | Menu & Harga — MAU'S Kitchen | Lihat menu lengkap Taichan, Minuman, dan ChocoBerry beserta harganya. Pesan langsung lewat WhatsApp. |
| `/menu/taichan` | Menu Taichan — MAU'S Kitchen | Taichan daging & kulit dengan sambal khas. Mulai Rp35.000. Pedesnya nampol, rasanya nagih! |
| `/menu/minuman` | Menu Minuman — MAU'S Kitchen | Thai Tea, Teh Susu, Aren Latte, dan Teh Original. Mulai Rp10.000. |
| `/menu/chocoberry` | ChocoBerry — Buah Coklat Premium | Strawberry, anggur, dan pisang segar disiram coklat premium. Mulai Rp25.000. |
| `/tentang` | Tentang Kami — MAU'S Kitchen | Cerita di balik MAU'S Kitchen, dapur rumahan yang memasak dengan cinta. |
| `/kontak` | Kontak & Jam Buka — MAU'S Kitchen | Hubungi MAU'S Kitchen lewat WhatsApp 0816-1769-1585 untuk pesan atau tanya menu. |

### Implementasi

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: "MAU'S Kitchen — Taichan, Minuman & ChocoBerry",
    template: "%s | MAU'S Kitchen",
  },
  description:
    "Sate taichan pedas, minuman segar, dan ChocoBerry buah coklat premium. Pesan online, bayar QRIS. Homemade with Love.",
  keywords: ["taichan", "sate taichan", "chocoberry", "thai tea", "maus kitchen"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "MAU'S Kitchen",
    images: [{ url: "/assets/og/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
}
```

---

## 15.3 Structured data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "MAU'S Kitchen",
  "description": "UMKM kuliner rumahan: sate taichan, minuman, dan dessert ChocoBerry.",
  "slogan": "Homemade with Love",
  "image": "https://mauskitchen.com/assets/brand/logo-maus-kitchen.jpeg",
  "telephone": "+6281617691585",
  "servesCuisine": ["Indonesian", "Street Food", "Dessert"],
  "priceRange": "Rp5.000 - Rp48.000",
  "acceptsReservations": false,
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "ID",
    "addressLocality": "TBD"
  },
  "potentialAction": {
    "@type": "OrderAction",
    "target": "https://mauskitchen.com/menu"
  }
}
```

Tambahkan juga `Menu` + `MenuItem` schema di halaman `/menu` agar harga bisa muncul di hasil pencarian.

---

## 15.4 Copywriting siap pakai

### Hero

> **Taichan Pedas, Minuman Segar, Dessert Coklat Premium**
> Dibuat segar setiap hari dari dapur rumahan kami. Homemade with Love ❤️
>
> `[ Lihat Menu ]` `[ Pesan via WhatsApp ]`

### Section Taichan

> **🔥 TAICHAN — Pedesnya Nampol, Rasanya Nagih!**
> Sate ayam dibakar tanpa bumbu kacang, ditemani sambal taichan racikan sendiri
> yang pedasnya bikin nagih. Pilih daging yang juicy atau kulit yang renyah.

### Section Minuman

> **🧋 MINUMAN — Penyeimbang Pedas yang Pas**
> Dari Teh Original yang menyegarkan sampai Aren Latte dengan manis alami gula aren.
> Semua disajikan dingin dan pas untuk menemani taichan.

### Section ChocoBerry

> **🍓 CHOCOBERRY — Fresh Berries, Premium Chocolate**
> Strawberry, anggur, dan pisang segar dalam cup, disiram coklat premium yang lumer.
> Tambah topping Pistacio Kunava untuk sensasi renyah yang sempurna.
> *Made with Love, Just for You.*

### Kenapa MAU'S Kitchen

| Judul | Isi |
|---|---|
| 🏠 Dapur Rumahan | Dimasak sendiri, bukan pabrikan. Rasa rumah yang konsisten. |
| 🥬 Bahan Segar | Buah dan ayam dipilih setiap hari, bukan stok lama. |
| 🌶️ Sambal Racikan Sendiri | Resep sambal taichan khas yang tidak ada di tempat lain. |
| 💳 Bayar Gampang | QRIS dari DANA, GoPay, OVO, atau m-banking apa pun. |

### Cara pesan (4 langkah)

1. **Pilih Menu** — telusuri Taichan, Minuman, atau ChocoBerry.
2. **Masukkan Keranjang** — atur ukuran, topping, dan jumlah.
3. **Isi Data** — nama, WhatsApp, dan alamat pengiriman.
4. **Bayar & Konfirmasi** — scan QRIS, kirim bukti, pesanan langsung diproses.

### Tentang Kami

> MAU'S Kitchen berawal dari dapur kecil di rumah dan satu keyakinan sederhana:
> makanan enak itu soal ketulusan, bukan ukuran dapurnya.
>
> Kami mulai dari sate taichan dengan sambal racikan sendiri, lalu melengkapinya
> dengan minuman segar dan ChocoBerry — buah segar berbalut coklat premium.
>
> Setiap pesanan disiapkan hari itu juga. Tidak ada stok semalam, tidak ada bahan
> asal-asalan. Itu janji kami sejak awal: **Homemade with Love**.

### CTA penutup

> **Lagi lapar? Atau lagi pengen yang manis?**
> Pesan sekarang, kami siapkan langsung dari dapur.
> `[ Pesan Sekarang ]`

---

## 15.5 Aset gambar untuk SEO & sosial

| Aset | Ukuran | Keterangan |
|---|---|---|
| `og-default.jpg` | 1200×630 | Logo + tagline + foto produk |
| `og-taichan.jpg` | 1200×630 | Khusus halaman Taichan |
| `og-chocoberry.jpg` | 1200×630 | Khusus halaman ChocoBerry |
| `favicon.ico` | 32×32 | Logo disederhanakan |
| `apple-touch-icon.png` | 180×180 | Logo |
| Foto produk | 800×1000 (4:5) | Satu file per produk, ≤ 200KB, WebP |

> Sumber foto: potong dari poster resmi di `assets/menu/`. Idealnya, minta foto
> produk terpisah tanpa teks poster agar tampilan web lebih bersih.

---

## 15.6 SEO lokal (paling berdampak untuk UMKM)

1. **Google Business Profile** — daftarkan usaha, isi menu, jam buka, dan foto.
   Ini biasanya memberi dampak lebih besar daripada optimasi teknis website.
2. Pasang tautan website di bio Instagram, WhatsApp Business, dan status.
3. Cetak QR code menuju website untuk ditempel di booth atau kemasan.
4. Konsistenkan **NAP** (Name, Address, Phone) di semua platform.
5. Minta pelanggan memberi ulasan Google — tampilkan kembali di halaman testimoni.

---

## 15.7 `sitemap.ts` dan `robots.ts`

```ts
// app/sitemap.ts
import menu from "@/data/menu.json"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL!
  const statis = ["", "/menu", "/tentang", "/kontak"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }))
  const produk = menu.items.map((i) => ({
    url: `${base}/produk/${i.id}`,
    lastModified: new Date(menu.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))
  return [...statis, ...produk]
}

// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

---

➡️ Lanjut ke `16_TESTING_QA.md`
