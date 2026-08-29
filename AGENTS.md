# AGENTS.md — Aturan Wajib untuk AI Coding Agent

File ini dibaca **pertama kali** oleh AI coding agent sebelum menulis satu baris kode pun.

---

## 1. Identitas proyek

| Item | Nilai |
|---|---|
| Nama brand | **MAU'S Kitchen** (ditulis `MAU'S Kitchen`, bukan `Maus Kitchen`) |
| Tagline | Homemade with Love |
| Jenis usaha | UMKM kuliner (Taichan, Minuman, ChocoBerry) |
| WhatsApp Admin | `081617691585` → format internasional `6281617691585` |
| Bahasa UI | Bahasa Indonesia |
| Mata uang | IDR, format `Rp25.000` (titik sebagai pemisah ribuan) |

---

## 2. Urutan baca dokumen (WAJIB)

```
1. AGENTS.md            (file ini)
2. .ai/CONTEXT.md
3. .ai/AGENT_PROMPT.md
4. docs/03_PRD.md
5. docs/05_MENU_CATALOG.md
6. docs/09_TECH_STACK.md
7. Dokumen lain sesuai fitur yang dikerjakan
```

---

## 3. Aturan keras (hard rules)

1. **Sumber kebenaran data menu** = `data/menu.json`. Jangan hardcode harga di komponen.
2. **Dilarang menambah/mengubah/menghapus item menu** tanpa instruksi eksplisit dari pemilik.
3. **Dilarang mengarang** nomor rekening, nomor WhatsApp, alamat, atau jam operasional.
   Jika data belum ada, pakai placeholder `TBD` dan catat di `docs/18_ROADMAP.md`.
4. **Mobile-first.** ≥85% pelanggan UMKM mengakses lewat HP. Desain 360px dulu, baru desktop.
5. **Tanpa login untuk pelanggan.** Pemesanan harus bisa selesai tanpa daftar akun.
6. **Jangan menyimpan data kartu / kredensial pembayaran** di repo maupun database.
7. Semua secret masuk `.env.local` dan **tidak boleh** di-commit.
8. Setiap PR/perubahan besar wajib memperbarui dokumen terkait di `docs/`.

---

## 4. Definition of Done (per fitur)

- [ ] Fungsional sesuai acceptance criteria di `docs/03_PRD.md`
- [ ] Responsif di 360px, 768px, 1280px
- [ ] Tidak ada error di console & `npm run build` sukses
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 90
- [ ] Teks UI Bahasa Indonesia, harga terformat `Rp`
- [ ] Dokumen terkait di `docs/` sudah diperbarui

---

## 5. Gaya komunikasi agent

- Jelaskan rencana singkat sebelum eksekusi (maks. 5 poin).
- Tulis kode lengkap, bukan potongan `// ...rest of code`.
- Jika ada asumsi, tulis eksplisit di bagian akhir jawaban dengan label `ASUMSI:`.
- Jika ada kebutuhan yang ambigu, **tanya dulu**, jangan menebak hal yang berdampak ke bisnis.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
