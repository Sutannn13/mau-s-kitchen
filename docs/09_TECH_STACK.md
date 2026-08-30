# 09 — Tech Stack & Arsitektur

## 9.1 Stack yang dipilih

| Lapisan             | Teknologi                            | Alasan                                                                      |
| ------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| Framework           | **Next.js 15 (App Router)**          | SSG cepat, SEO bagus, deploy gratis di Vercel                               |
| Bahasa              | **TypeScript (strict)**              | Aman untuk perhitungan harga & data pesanan                                 |
| Styling             | **Tailwind CSS**                     | Cepat, konsisten, mudah dipakai AI agent                                    |
| Komponen UI         | **shadcn/ui** + Radix                | Aksesibel, bisa dikustom penuh sesuai brand                                 |
| Ikon                | **lucide-react**                     | Ringan, konsisten                                                           |
| State keranjang     | **Zustand** + `persist` middleware   | Sederhana, otomatis simpan ke `localStorage`                                |
| Form & validasi     | **React Hook Form** + **Zod**        | Validasi tipe-aman, dipakai ulang di server                                 |
| Database (Fase 2)   | **Supabase (Postgres)**              | Tier gratis, ada Auth & Storage sekaligus                                   |
| Auth admin (Fase 2) | **Supabase Auth** (email + password) | Cukup untuk 1–2 admin                                                       |
| Penyimpanan file    | **Supabase Storage**                 | Untuk bukti pembayaran + foto menu (bucket `payment-proofs`, `menu-images`) |
| Hosting             | **Vercel**                           | Gratis, CDN global, preview deployment                                      |
| Analitik            | **Vercel Analytics** / Umami         | Ringan & hemat privasi                                                      |
| Animasi             | **Framer Motion** (secukupnya)       | Transisi halus                                                              |

### Yang sengaja TIDAK dipakai

| Teknologi                         | Alasan                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| WordPress / WooCommerce           | Berat, biaya hosting, sulit dikustom sesuai brand                      |
| Payment gateway berbayar (Fase 1) | Ada biaya per transaksi & butuh dokumen legal; QRIS manual sudah cukup |
| Redux                             | Terlalu kompleks untuk kebutuhan keranjang sederhana                   |
| CMS eksternal                     | Menu jarang berubah; cukup JSON + dashboard admin                      |

---

## 9.2 Arsitektur sistem

```
┌───────────────────────────────────────────────────┐
│                        PELANGGAN                            │
│                    (HP / Browser)                           │
└─────────────────────────┬──────────────────────────┘
                            │ HTTPS
┌─────────────────────────┴──────────────────────────┐
│                  NEXT.JS APP (Vercel)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐    │
│  │ Static Page │  │ Client      │  │ Route Handler │    │
│  │ (menu, SEO) │  │ (keranjang) │  │ (/api/*)      │    │
│  └─────────────┘  └─────────────┘  └───────┬───────┘    │
│         │                │                 │            │
│  data/menu.json    localStorage             │            │
└────────────────────────────────────┬────────────┘
                                              │
              ┌──────────────────────────┴────────────┐
              │                                          │
     ┌──────┴───────┐                     ┌─────────┴────────┐
     │   SUPABASE    │                     │   WHATSAPP      │
     │  · Postgres   │                     │  wa.me deeplink │
     │  · Auth       │                     │  → admin        │
     │  · Storage    │                     └────────────────┘
     └───────────────┘
              │
     ┌──────┴───────┐
     │  DASHBOARD    │  ← admin login
     │  /admin       │
     └───────────────┘
```

---

## 9.3 Struktur folder aplikasi

```
src/
├── app/
│   ├── layout.tsx                 # Root layout: font, header, footer, FAB
│   ├── page.tsx                   # Landing page
│   ├── globals.css
│   ├── menu/
│   │   ├── page.tsx
│   │   └── [kategori]/page.tsx
│   ├── produk/[slug]/page.tsx
│   ├── keranjang/page.tsx
│   ├── checkout/page.tsx
│   ├── pembayaran/[kode]/page.tsx
│   ├── pesanan/[kode]/page.tsx
│   ├── tentang/page.tsx
│   ├── kontak/page.tsx
│   ├── admin/
│   │   ├── layout.tsx             # Proteksi auth
│   │   ├── login/page.tsx
│   │   ├── pesanan/page.tsx
│   │   ├── menu/page.tsx          # CRUD menu mandiri (FR-27)
│   │   └── rekap/page.tsx
│   ├── api/
│   │   ├── orders/route.ts
│   │   ├── orders/[kode]/route.ts
│   │   ├── menu/route.ts
│   │   └── admin/menu/            # CRUD menu (FR-27)
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/    (Header, Footer, MobileBottomBar, WhatsAppFab)
│   ├── menu/      (MenuCard, MenuGrid, CategoryTabs, ProductSheet)
│   ├── cart/      (CartItemRow, CartSummary)
│   ├── checkout/  (CheckoutForm, PaymentMethodPicker)
│   ├── payment/   (QrisPanel)
│   ├── order/     (OrderStatusTimeline)
│   ├── admin/     (OrderTable, OrderDetail, StatusSelect, DailyRecap,
│   │              MenuManager, MenuItemEditor)
│   ├── common/    (Price, EmptyState, Toast, QuantityStepper)
│   └── ui/        (shadcn/ui)
├── lib/
│   ├── menu.ts                    # Pembaca JSON fallback + test fixture
│   ├── menu-data.ts               # Loader DB + fallback JSON (FR-27)
│   ├── menu-image.ts              # Validasi+optimasi gambar menu (sharp)
│   ├── cart-store.ts              # Zustand store
│   ├── format.ts                  # formatRupiah, formatTanggal
│   ├── order-code.ts              # Generator MK-YYMMDD-XXX
│   ├── whatsapp.ts                # Builder pesan & deeplink
│   ├── validations.ts             # Skema Zod (checkout + admin menu)
│   ├── store-hours.ts             # Logika buka/tutup
│   └── supabase/                  # Client & server helper
├── types/
│   ├── menu.ts
│   └── order.ts
└── config/
    ├── site.ts                    # Nama, deskripsi, kontak, jam buka
    └── payment.ts                 # Info QRIS & rekening

public/
├── assets/brand/
├── assets/menu/
└── assets/payment/qris.jpeg       # QRIS statis resmi merchant

data/
└── menu.json
```

---

## 9.4 Dependensi utama

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "exceljs": "^4.4.0",
    "motion": "^13.1.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "playwright-core": "^1.62.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "vitest": "^4.1.0"
  }
}
```

`playwright-core` menggunakan browser Edge/Chrome yang sudah tersedia di mesin QA,
sehingga audit responsif dapat berjalan tanpa mengunduh binary browser tambahan.
Vitest digunakan untuk unit test logika uang dan integritas data menu.

`exceljs` hanya dimuat dinamis setelah admin menekan **Unduh Excel**. Workbook
dibuat lokal di browser admin, sehingga tidak menambah beban awal halaman dan
tidak mengirim data laporan ke layanan pihak ketiga.

> **`motion`** (2026-08): menggantikan `framer-motion` sebagai dependensi
> animasi. `motion` adalah penerus resmi framer-motion (paket npm `motion`,
> import dari `motion/react`) oleh tim yang sama — API identik, kompatibel
> React 19 + Next 16, dan hanya dipakai untuk animasi ringan panel admin
> (pill periode, fade konten, ikon centang "pop"). Preferensi
> `prefers-reduced-motion` dihormati lewat `MotionConfig reducedMotion="user"`
> di `components/admin/MotionProvider.tsx`.

---

## 9.5 Environment variables

```bash
# .env.example
NEXT_PUBLIC_SITE_URL=https://mauskitchen.com
NEXT_PUBLIC_WHATSAPP_NUMBER=6281617691585
NEXT_PUBLIC_WHATSAPP_DISPLAY=0816-1769-1585

# Supabase (Fase 2)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Info pembayaran
NEXT_PUBLIC_QRIS_IMAGE_PATH=/assets/payment/qris.jpeg
NEXT_PUBLIC_QRIS_MERCHANT_NAME="SATE TAICHAN HANNA"
NEXT_PUBLIC_BANK_NAME=BCA
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=
NEXT_PUBLIC_BANK_ACCOUNT_NAME=
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai di server (route handler), **jangan** di komponen client.

---

## 9.6 Strategi rendering

| Halaman                                          | Strategi                  | Alasan                               |
| ------------------------------------------------ | ------------------------- | ------------------------------------ |
| `/`, `/menu`, `/produk/*`, `/tentang`, `/kontak` | SSG                       | Konten jarang berubah, cepat & hemat |
| Ketersediaan menu                                | ISR `revalidate: 60`      | Perubahan stok tampil maks 60 detik  |
| `/keranjang`, `/checkout`                        | Client Component          | Butuh `localStorage`                 |
| `/pembayaran/*`, `/pesanan/*`                    | Dynamic                   | Bergantung kode pesanan              |
| `/admin/*`                                       | Dynamic + `force-dynamic` | Data real-time & terproteksi         |

---

## 9.7 Optimasi performa

1. Gunakan `next/image` dengan `sizes` yang tepat. Pada Cloudflare OpenNext tanpa binding `IMAGES`, jangan mengandalkan transformasi `/_next/image`; pakai varian statis `*-optimized.jpg`, `*-card.jpg`, dan `*-thumb.jpg` yang dikompresi build-time.
2. Foto poster asli besar → kompres ke ≤ 200KB dan potong per konteks tampil.
3. `next/font` untuk semua font (hindari FOUT dan request eksternal).
4. `dynamic()` untuk komponen berat (bottom sheet, dashboard admin).
5. Batasi Motion hanya pada elemen kunci (pill periode admin, fade konten).
6. Prefetch link menu dari landing page.
7. Target bundle JS halaman utama < 150KB gzip.

---

➡️ Lanjut ke `10_DATA_MODEL.md`
