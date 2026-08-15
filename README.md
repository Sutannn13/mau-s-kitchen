# MAU'S Kitchen — Website UMKM

> **Homemade with Love** · Taichan · Minuman · ChocoBerry
> WhatsApp Order: **0816-1769-1585**

Repositori ini berisi **dokumentasi lengkap + spesifikasi teknis** untuk membangun website
UMKM **MAU'S Kitchen**. Dokumentasi ditulis khusus agar bisa langsung dibaca dan dieksekusi
oleh **AI coding agent** (Cursor, Claude Code, Codex, GitHub Copilot, Windsurf, dsb.)
tanpa perlu penjelasan ulang dari manusia.

---

## 🚀 Mulai dari mana?

| Urutan | File | Isi |
|---|---|---|
| 1 | `.ai/AGENT_PROMPT.md` | **Prompt utama** — copy-paste ini ke AI coding agent |
| 2 | `.ai/CONTEXT.md` | Konteks bisnis padat (agar agent tidak halusinasi) |
| 3 | `docs/01_README.md` | Gambaran repo & cara menjalankan proyek |
| 4 | `docs/02` → `docs/19` | Dokumentasi berurutan sampai deployment |
| 5 | `.ai/TASK_BREAKDOWN.md` | Checklist task per sprint |
| 6 | `docs/19_SETUP_MANUAL.md` | **Panduan setup manual** (Supabase, env, Vercel) |

---

## 📁 Struktur repo

```
maus-kitchen-web/
├── README.md                     ← kamu di sini
├── AGENTS.md                     ← aturan wajib untuk AI coding agent
├── .ai/
│   ├── AGENT_PROMPT.md           ← PROMPT UTAMA
│   ├── CONTEXT.md                ← ringkasan konteks bisnis
│   ├── CODING_STANDARDS.md       ← standar kode & konvensi
│   ├── TASK_BREAKDOWN.md         ← breakdown task per sprint
│   └── PROMPT_LIBRARY.md         ← kumpulan prompt siap pakai per fitur
├── docs/
│   ├── 01_README.md              ← gambaran & cara jalanin proyek
│   ├── 02_PROJECT_OVERVIEW.md    ← ringkasan bisnis, target user, scope
│   ├── 03_PRD.md                 ← functional, non-functional, user story, AC
│   ├── 04_BUSINESS_FLOW.md       ← alur pelanggan → checkout → bayar → admin
│   ├── 05_MENU_CATALOG.md        ← katalog menu + harga (source of truth)
│   ├── 06_BRAND_GUIDELINE.md     ← logo, warna, tipografi, tone of voice
│   ├── 07_INFORMATION_ARCHITECTURE.md ← sitemap & routing
│   ├── 08_UI_UX_SPEC.md          ← spesifikasi halaman & komponen
│   ├── 09_TECH_STACK.md          ← stack, alasan, struktur folder aplikasi
│   ├── 10_DATA_MODEL.md          ← skema data & tipe TypeScript
│   ├── 11_API_SPEC.md            ← endpoint & contract
│   ├── 12_PAYMENT_QRIS.md        ← QRIS dinamis (DANA / BCA / GoPay)
│   ├── 13_WHATSAPP_INTEGRATION.md← checkout via WhatsApp deeplink
│   ├── 14_ADMIN_DASHBOARD.md     ← dashboard admin & manajemen pesanan
│   ├── 15_SEO_CONTENT.md         ← SEO lokal, metadata, copywriting
│   ├── 16_TESTING_QA.md          ← strategi test & QA checklist
│   ├── 17_DEPLOYMENT.md          ← deploy ke Vercel, domain, env
│   ├── 18_ROADMAP.md             ← roadmap fase 1–3
│   └── 19_SETUP_MANUAL.md        ← panduan setup manual (Supabase/Vercel)
├── supabase/
│   └── schema.sql                ← skema database (jalankan di SQL Editor)
├── data/
│   └── menu.json                 ← seed data menu (siap dipakai kode)
└── assets/
    ├── brand/logo-maus-kitchen.jpeg
    └── menu/menu-taichan.jpeg, menu-minuman.jpeg, menu-chocoberry.jpeg
```

---

## 🎯 Ringkasan proyek dalam 5 baris

1. Website katalog + pemesanan online untuk UMKM **MAU'S Kitchen**.
2. Tiga lini produk: **Taichan**, **Minuman**, **ChocoBerry**.
3. Pelanggan pilih menu → keranjang → checkout → bayar **QRIS (DANA/BCA/GoPay)** atau COD.
4. Konfirmasi pesanan otomatis dikirim ke **WhatsApp admin** (0816-1769-1585).
5. Admin kelola pesanan lewat **dashboard sederhana** (`/admin`).

---

## ⚠️ Aturan penting

- **Jangan mengarang harga atau nama menu.** Semua harga wajib mengacu ke `docs/05_MENU_CATALOG.md` dan `data/menu.json`.
- **Jangan mengubah identitas brand.** Warna & tone diatur di `docs/06_BRAND_GUIDELINE.md`.
- Semua teks yang dilihat pelanggan menggunakan **Bahasa Indonesia**.
- Mata uang: **Rupiah (IDR)**, format `Rp25.000`.

---

_Disusun sebagai dokumentasi fondasi proyek. Versi 1.0 — Agustus 2026._

---

## Menjalankan aplikasi

Prasyarat: Node.js dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser. Untuk memeriksa kualitas fondasi proyek:

```bash
npm run typecheck
npm run lint
npm run build
```
