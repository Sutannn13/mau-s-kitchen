# CONTEXT.md — Konteks Bisnis Padat

> File ini dirancang untuk **dimuat ke context window AI coding agent**.
> Isinya ringkas tapi lengkap, cukup untuk mengerjakan fitur apa pun tanpa membaca seluruh `docs/`.

---

## Identitas

```yaml
brand: "MAU'S Kitchen"
tagline: "Homemade with Love"
jenis: "UMKM kuliner rumahan (F&B)"
whatsapp: "6281617691585"
whatsapp_display: "0816-1769-1585"
bahasa_ui: "Bahasa Indonesia"
mata_uang: "IDR"
format_harga: "Rp35.000"
zona_waktu: "Asia/Jakarta (WIB)"
sub_brand: "ChocoBerry by Mau's Kitchen"
```

---

## Menu lengkap (snapshot seed awal)

> **Sumber kebenaran hidup sejak FR-27:** tabel `menu_items` + relasi di
> Supabase, dikelola admin lewat dashboard `/admin/menu` + endpoint
> `/api/admin/menu/*`. Daftar di bawah hanya snapshot seed awal dari
> `data/menu.json` (seed + fallback read-only). Jangan menambah/mengubah item
> menu dari kode — gunakan dashboard. Lihat `docs/05_MENU_CATALOG.md` §5.6.

### Taichan — tagline: "Pedesnya nampol, rasanya nagih!"

| id | nama | harga |
|---|---|---|
| `taichan-daging` | Taichan Daging | 35000 |
| `taichan-kulit` | Taichan Kulit | 35000 |
| `lontong` | Lontong | 5000 |
| `sambel-taichan` | Sambel Taichan | 5000 |

### Minuman

| id | nama | harga |
|---|---|---|
| `teh-original` | Teh Original | 10000 |
| `thai-tea` | Thai Tea | 17000 |
| `teh-susu` | Teh Susu | 17000 |
| `aren-latte` | Aren Latte | 17000 |

### ChocoBerry — tagline: "Fresh Berries, Premium Chocolate"

| id | nama | Small | Medium |
|---|---|---|---|
| `choco-berry-original` | Choco Berry Original | 25000 | 35000 |
| `choco-berry-grape` | Choco Berry Grape | 30000 | 40000 |
| `choco-berry-banana` | Choco Berry Banana | 25000 | 35000 |

**Add-on (hanya untuk ChocoBerry):** `pistacio-kunava` — Pistacio Kunava — **+8000**

**Diarsipkan (jangan ditampilkan):** Lemon Tea, Susu Strawberry — tidak ada di poster terbaru.

---

## Aturan harga

```
subtotal_baris = (harga_varian + total_addon) × jumlah
subtotal_pesanan = Σ subtotal_baris
total = subtotal_pesanan + ongkir
```

- Semua uang **integer**, tanpa desimal, tanpa pajak tambahan.
- Pesanan `ambil` selalu `ongkir = 0` dan total langsung final.
- Pesanan `antar` mulai dengan `ongkir = null`; tampilkan subtotal sementara dan
  larang pembayaran sampai admin menyimpan ongkir (Rp0 tetap nilai final yang sah).
- Ongkir terkunci setelah klaim/bukti pembayaran atau status `DIKONFIRMASI`.
- Harga **selalu** dihitung ulang di server saat membuat pesanan.

---

## Pembayaran

| Metode | Status | Catatan |
|---|---|---|
| QRIS | Aktif | Dari merchant DANA / BCA / GoPay. Fase 1 memakai QRIS statis + nominal manual |
| Transfer BCA | Aktif | Nomor rekening `TBD` |
| Tunai / COD | Aktif | Bayar saat pesanan diterima |
| Payment gateway otomatis | Fase 3 | Midtrans / Xendit, ≈ 0,7% per transaksi |

---

## Alur inti

```
Menu → Keranjang → Checkout → Kode Pesanan (MK-YYMMDD-XXX)
     → Pesanan tersimpan ke dashboard admin (WhatsApp hanya aksi opsional)
     → Halaman pembayaran QRIS
     → Admin verifikasi → status: BARU → DIKONFIRMASI → DIPROSES → DIKIRIM → SELESAI
```

---

## Stack

```
Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · shadcn/ui
Zustand (keranjang, persist) · React Hook Form + Zod · lucide-react
Supabase (Postgres + Auth + Storage) — Fase 2
Vercel — hosting
```

---

## Warna kunci

```
cream    #F7EEE4   brown-deep #3E2318   gold  #C79A4B   rose  #E8AFA4
ink      #0F0F0F   chili      #D62828   flame #F4B01A
choco    #2A1A12   berry      #C0392B   pistachio #8A9A3B
```

Aturan section: Hero/Tentang = cream · Taichan & Minuman = ink + chili/flame · ChocoBerry = choco + gold.

---

## Larangan keras

1. ❌ Jangan mengarang harga, menu, alamat, jam buka, atau nomor rekening.
2. ❌ Jangan hardcode harga di komponen — baca lewat `src/lib/menu-data.ts`
   (DB utama, fallback `data/menu.json` saat Supabase down).
3. ❌ Jangan menulis "Maus Kitchen" — selalu **MAU'S Kitchen**.
4. ❌ Jangan memakai bahasa Inggris di UI pelanggan.
5. ❌ Jangan mewajibkan login untuk pelanggan.
6. ❌ Jangan mempercayai harga yang dikirim dari browser.
7. ❌ Jangan commit secret ke repo.

---

## Nilai `TBD` yang belum dikonfirmasi

`jam_operasional` · `alamat` · `tarif_ongkir` · `minimum_order` ·
`nomor_rekening_bca` · `akun_instagram`

Gunakan placeholder `TBD` dan catat, jangan mengisi dengan tebakan.
