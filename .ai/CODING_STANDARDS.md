# CODING_STANDARDS.md

Standar penulisan kode untuk proyek website MAU'S Kitchen.

---

## 1. TypeScript

```jsonc
// tsconfig.json — wajib
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- ❌ Dilarang menggunakan `any`. Gunakan `unknown` + penyempitan tipe.
- ❌ Dilarang `@ts-ignore`. Jika terpaksa, pakai `@ts-expect-error` + komentar alasan.
- ✅ Tipe data domain didefinisikan di `src/types/`, bukan di dalam komponen.
- ✅ Gunakan `as const` untuk objek konfigurasi.
- ✅ Fungsi publik diberi tipe kembalian eksplisit.

---

## 2. Penamaan

| Jenis | Konvensi | Contoh |
|---|---|---|
| Komponen React | PascalCase | `MenuCard.tsx` |
| Hook | camelCase, awalan `use` | `useCart.ts` |
| Fungsi utilitas | camelCase | `formatRupiah` |
| Konstanta | SCREAMING_SNAKE_CASE | `WA_NUMBER` |
| Tipe / Interface | PascalCase | `CartItem` |
| File route | kebab-case (Bahasa Indonesia) | `app/keranjang/page.tsx` |
| ID data menu | kebab-case | `choco-berry-grape` |

**Bahasa penamaan:**
- URL & teks UI → **Bahasa Indonesia** (`/keranjang`, `/pembayaran`)
- Nama variabel & fungsi → **Bahasa Inggris** (`cartItems`, `handleSubmit`)
- Nilai domain khusus boleh Indonesia (`status: "DIPROSES"`)

---

## 3. Struktur komponen

```tsx
"use client" // hanya jika benar-benar butuh interaktivitas

import { useState } from "react"
import type { MenuItem } from "@/types/menu"
import { formatRupiah } from "@/lib/format"

interface MenuCardProps {
  item: MenuItem
  onAdd: (item: MenuItem) => void
}

export function MenuCard({ item, onAdd }: MenuCardProps) {
  // 1. hooks
  // 2. nilai turunan
  // 3. handler
  // 4. early return (loading / kosong)
  // 5. JSX
}
```

Aturan:
- **Server Component secara default.** Tambahkan `"use client"` hanya bila perlu.
- Satu komponen = satu tanggung jawab. Jika lebih dari ~150 baris, pecah.
- Props diketik dengan `interface`, bukan inline.
- Hindari `export default` untuk komponen (kecuali file `page.tsx`/`layout.tsx`).

---

## 4. Styling (Tailwind)

- Urutan kelas: layout → spacing → ukuran → tipografi → warna → efek → state.
- Gunakan `cn()` (clsx + tailwind-merge) untuk kelas kondisional.
- Jangan pakai nilai warna mentah (`#C79A4B`) — gunakan token (`text-gold`).
- Mobile-first: tulis kelas dasar dulu, baru `sm:` `md:` `lg:`.
- Hindari `!important` dan style inline.

```tsx
<button
  className={cn(
    "flex items-center gap-2 rounded-full px-5 py-3",
    "text-sm font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
    isDisabled
      ? "cursor-not-allowed bg-neutral-200 text-neutral-400"
      : "bg-gold text-brown-deep hover:bg-gold-light",
  )}
/>
```

---

## 5. State management

| Kebutuhan | Solusi |
|---|---|
| State lokal UI | `useState` |
| Keranjang belanja | Zustand store (`lib/cart-store.ts`) dengan `persist` |
| Form | React Hook Form + Zod |
| Data server | Server Component + `fetch` |

```ts
// lib/cart-store.ts
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => { /* gabungkan jika lineId sama */ },
      removeItem: (lineId) => { /* ... */ },
      updateQuantity: (lineId, qty) => { /* hapus jika qty < 1 */ },
      clear: () => set({ items: [] }),
      subtotal: () => cartSubtotal(get().items),
    }),
    { name: "mauskitchen-cart", version: 1 },
  ),
)
```

> Selalu sertakan `version` pada store agar struktur lama bisa dimigrasi saat data berubah.

---

## 6. Penanganan error

```ts
// ✅ Baik: pesan ramah untuk pengguna, detail teknis untuk log
try {
  const res = await fetch("/api/orders", { method: "POST", body })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
} catch (error) {
  console.error("[createOrder]", error)
  toast.error("Gagal membuat pesanan. Coba lagi sebentar lagi ya.")
  return null
}
```

- Pesan error yang dilihat pengguna: **Bahasa Indonesia, ramah, tanpa jargon**.
- Jangan pernah menampilkan stack trace ke pengguna.
- Setiap `catch` wajib melakukan sesuatu — dilarang `catch {}` kosong.

---

## 7. Aksesibilitas

- Setiap `<img>` / `next/image` wajib punya `alt` deskriptif Bahasa Indonesia.
- Elemen interaktif memakai `<button>` atau `<a>`, bukan `<div onClick>`.
- Setiap input punya `<label htmlFor>` yang terhubung.
- Modal/sheet: `role="dialog"`, `aria-modal`, focus trap, tutup dengan `Esc`.
- Target sentuh minimal 44×44px.
- Kontras teks minimal 4.5:1.

---

## 8. Performa

- `next/image` untuk semua gambar, dengan `sizes` yang tepat.
- `next/font` untuk semua font.
- `dynamic()` untuk komponen berat yang tidak langsung terlihat.
- Hindari `useEffect` untuk mengambil data yang bisa diambil di server.
- Jangan mengimpor seluruh pustaka ikon — impor per ikon.

---

## 9. Keamanan

1. Validasi ulang **semua** input di server dengan Zod.
2. Harga dihitung ulang di server dari `data/menu.json`.
3. `SUPABASE_SERVICE_ROLE_KEY` hanya di route handler / server action.
4. Rate limit pada endpoint pembuatan pesanan.
5. Batasi tipe dan ukuran file yang diunggah.
6. Jangan pernah mencatat data pribadi pelanggan lengkap ke log.

---

## 10. Git

```
feat:     fitur baru
fix:      perbaikan bug
docs:     perubahan dokumentasi
style:    format, tanpa perubahan logika
refactor: perbaikan struktur kode
test:     penambahan/perubahan test
chore:    build, dependency, konfigurasi
```

Cabang: `feature/nama-fitur`, `fix/nama-bug`, `docs/nama-dokumen`.

---

## 11. Komentar

- Tulis komentar untuk menjelaskan **kenapa**, bukan **apa**.
- Aturan bisnis wajib diberi komentar beserta rujukan dokumen.

```ts
// Add-on dihitung per porsi, bukan sekali per baris pesanan.
// Lihat docs/05_MENU_CATALOG.md §5.6 dan docs/16_TESTING_QA.md kasus #5.
const unitWithAddOns = item.unitPrice + item.addOns.reduce((s, a) => s + a.price, 0)
```

---

## 12. Checklist sebelum menyerahkan pekerjaan

- [ ] `npm run typecheck` bersih
- [ ] `npm run lint` bersih
- [ ] `npm run build` sukses
- [ ] Diuji pada lebar 360px
- [ ] Tidak ada `console.log` tersisa
- [ ] Tidak ada nilai harga yang di-hardcode
- [ ] Teks UI Bahasa Indonesia
- [ ] Dokumen di `docs/` diperbarui bila perilaku berubah
