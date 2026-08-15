# 01 — README Proyek

## 1.1 Tentang MAU'S Kitchen

**MAU'S Kitchen** adalah UMKM kuliner rumahan dengan tagline **"Homemade with Love"**.
Usaha ini dijalankan secara keluarga dan saat ini melayani pesanan lewat WhatsApp
(**0816-1769-1585**) serta penjualan langsung/booth.

Tiga lini produk utama:

| Lini | Deskripsi | Tagline |
|---|---|---|
| **Taichan** | Sate taichan ayam (daging & kulit) dengan sambal khas | *Pedesnya nampol, rasanya nagih!* |
| **Minuman** | Es teh & kopi susu kekinian | *Pedesnya nampol, rasanya nagih!* |
| **ChocoBerry** | Buah segar dalam cup disiram coklat premium | *Fresh Berries, Premium Chocolate* |

## 1.2 Kenapa butuh website?

Masalah saat ini:

1. Katalog menu hanya berupa gambar poster yang dikirim manual di WhatsApp.
2. Pelanggan sering bertanya harga & varian berulang-ulang → admin capek.
3. Pesanan masuk berantakan dalam bentuk chat bebas → rawan salah catat.
4. Tidak ada rekap penjualan harian.
5. Belum ada "wajah online" yang bisa dibagikan lewat satu link (bio Instagram, status WA).

Solusi website:

1. Katalog digital selalu update, satu link untuk semua.
2. Keranjang belanja + kalkulasi total otomatis (termasuk add-on & ongkir).
3. Checkout menghasilkan **pesan WhatsApp terstruktur** → admin tinggal baca.
4. Pembayaran **QRIS dinamis** (DANA / BCA / GoPay) atau COD.
5. Dashboard admin untuk memantau & merekap pesanan.

## 1.3 Cara kerja repo ini

Repo ini **dokumentasi-first**. Artinya:

```
docs/  →  dibaca AI coding agent  →  agent menulis kode  →  docs diperbarui
```

Setiap kali ada perubahan kebutuhan bisnis, **ubah dokumen dulu**, baru minta agent
mengimplementasikan. Ini mencegah kode dan dokumentasi jadi tidak sinkron.

## 1.4 Prasyarat development

| Tool | Versi minimum |
|---|---|
| Node.js | 20 LTS (disarankan 22) |
| npm / pnpm | npm 10 / pnpm 9 |
| Git | 2.40 |
| Editor | VS Code + AI agent (Cursor / Claude Code / Copilot) |

## 1.5 Cara menjalankan proyek

```bash
# 1. Clone
git clone <repo-url> maus-kitchen-web
cd maus-kitchen-web

# 2. Install dependency
npm install

# 3. Salin environment variable
cp .env.example .env.local
# lalu isi nilainya (lihat docs/17_DEPLOYMENT.md)

# 4. Jalankan development server
npm run dev
# buka http://localhost:3000

# 5. Build produksi
npm run build && npm run start
```

## 1.6 Script npm yang tersedia

| Script | Fungsi |
|---|---|
| `npm run dev` | Development server (hot reload) |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |

## 1.7 Konvensi commit

Gunakan **Conventional Commits**:

```
feat(menu): tambah filter kategori taichan
fix(cart): perbaiki total add-on pistacio kunava
docs(prd): update acceptance criteria checkout
chore(deps): update next ke 15.x
```

## 1.8 Kontak & kepemilikan

| Peran | Keterangan |
|---|---|
| Pemilik usaha | Keluarga pemilik MAU'S Kitchen |
| Admin pesanan | WhatsApp `0816-1769-1585` |
| Developer / PIC teknis | (isi nama) |

---

➡️ Lanjut ke `02_PROJECT_OVERVIEW.md`
