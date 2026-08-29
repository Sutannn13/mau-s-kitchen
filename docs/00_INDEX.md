# 00 — Index Dokumentasi MAU'S Kitchen

Daftar seluruh dokumen proyek beserta kapan harus dibaca.

---

## Urutan baca untuk manusia (pertama kali)

1. `01_README.md` — apa ini dan cara menjalankannya
2. `02_PROJECT_OVERVIEW.md` — kenapa proyek ini dibuat
3. `05_MENU_CATALOG.md` — produk & harga
4. `18_ROADMAP.md` — rencana pengerjaan

## Urutan baca untuk AI coding agent

1. `../.ai/AGENT_PROMPT.md` — **master prompt, mulai dari sini**
2. `../.ai/CONTEXT.md` — konteks bisnis padat
3. `05_MENU_CATALOG.md` + `../data/menu.json` — sumber kebenaran harga
4. `../.ai/TASK_BREAKDOWN.md` — daftar task berurutan
5. `../.ai/CODING_STANDARDS.md` — standar kode
6. Dokumen spesifik sesuai task yang dikerjakan

---

## Daftar dokumen

| No | File | Isi | Dibaca saat |
|---|---|---|---|
| 01 | `01_README.md` | Gambaran repo, cara install & menjalankan | Setup awal |
| 02 | `02_PROJECT_OVERVIEW.md` | Ringkasan bisnis, persona, ruang lingkup | Memahami konteks |
| 03 | `03_PRD.md` | Kebutuhan fungsional & non-fungsional, user story | Menentukan fitur |
| 04 | `04_BUSINESS_FLOW.md` | Alur pesan, status pesanan, alur admin | Membangun alur |
| 05 | `05_MENU_CATALOG.md` | **Harga & katalog (source of truth)** | Selalu |
| 06 | `06_BRAND_GUIDELINE.md` | Logo, warna, font, tone of voice | Styling |
| 07 | `07_INFORMATION_ARCHITECTURE.md` | Sitemap & routing | Membuat halaman |
| 08 | `08_UI_UX_SPEC.md` | Spesifikasi UI per halaman | Membangun UI |
| 09 | `09_TECH_STACK.md` | Stack, struktur folder, dependency | Setup teknis |
| 10 | `10_DATA_MODEL.md` | Tipe TypeScript & skema database | Data & DB |
| 11 | `11_API_SPEC.md` | Kontrak endpoint API | Backend |
| 12 | `12_PAYMENT_QRIS.md` | Strategi pembayaran QRIS 3 fase | Pembayaran |
| 13 | `13_WHATSAPP_INTEGRATION.md` | Template & builder pesan WhatsApp | Checkout |
| 14 | `14_ADMIN_DASHBOARD.md` | Spesifikasi dashboard admin | Fase 2 |
| 15 | `15_SEO_CONTENT.md` | Metadata, JSON-LD, copywriting | SEO & konten |
| 16 | `16_TESTING_QA.md` | Strategi test & checklist QA | Sebelum rilis |
| 17 | `17_DEPLOYMENT.md` | Deploy Vercel, env, checklist go-live | Rilis |
| 18 | `18_ROADMAP.md` | Fase 1–3 & daftar `TBD` | Perencanaan |
| 19 | `19_SETUP_MANUAL.md` | Setup manual Supabase dan environment | Setup |
| 20 | `20_SECURITY_GO_LIVE.md` | Gate keamanan Railway/Netlify | Sebelum rilis |

## Folder `.ai/`

| File | Isi |
|---|---|
| `AGENT_PROMPT.md` | **Master prompt** untuk AI coding agent |
| `CONTEXT.md` | Konteks bisnis padat, hemat token |
| `CODING_STANDARDS.md` | Standar penulisan kode |
| `TASK_BREAKDOWN.md` | 6 sprint, task berurutan |
| `PROMPT_LIBRARY.md` | 13 prompt siap pakai per fitur |

## Folder lain

| Path | Isi |
|---|---|
| `data/menu.json` | Data menu terstruktur (dipakai langsung oleh aplikasi) |
| `assets/brand/` | Logo MAU'S Kitchen |
| `assets/menu/` | Poster menu asli: Taichan, Minuman, ChocoBerry |
| `.env.example` | Contoh environment variables |
| `AGENTS.md` | Aturan singkat untuk agent di root repo |

---

## Prinsip menjaga dokumentasi

1. `05_MENU_CATALOG.md` dan `data/menu.json` **harus selalu sinkron**.
2. Jika perilaku aplikasi berubah, perbarui dokumennya di PR yang sama.
3. Nilai yang belum pasti ditulis `TBD` — dilarang menebak.
4. Setiap keputusan besar dicatat di tabel log keputusan `18_ROADMAP.md` §18.6.
