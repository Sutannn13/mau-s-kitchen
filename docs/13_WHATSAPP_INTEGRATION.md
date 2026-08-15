# 13 — Integrasi WhatsApp

WhatsApp adalah **kanal utama** MAU'S Kitchen. Website tidak menggantikan WhatsApp,
tetapi membuat pesan yang masuk ke WhatsApp menjadi rapi dan terstruktur.

---

## 13.1 Nomor & format

| Item | Nilai |
|---|---|
| Nomor tampilan | `0816-1769-1585` |
| Format internasional | `6281617691585` |
| Env variable | `NEXT_PUBLIC_WHATSAPP_NUMBER=6281617691585` |
| Base deeplink | `https://wa.me/6281617691585?text=<pesan-terenkode>` |

> Jangan pernah menuliskan nomor secara hardcode di komponen. Selalu baca dari config.

---

## 13.2 Builder pesan WhatsApp

```ts
// lib/whatsapp.ts
import { formatRupiah } from "./format"
import type { Order } from "@/types/order"

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281617691585"

export const buildOrderMessage = (order: Order): string => {
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt))

  const items = order.items
    .map((it, i) => {
      const variant = it.variantName ? ` (${it.variantName})` : ""
      const addOns = it.addOns.length
        ? `\n   + ${it.addOns.map((a) => a.name).join(", ")}`
        : ""
      const note = it.note ? `\n   📝 ${it.note}` : ""
      const unit = it.unitPrice + it.addOns.reduce((s, a) => s + a.price, 0)
      const sub = unit * it.quantity
      return `${i + 1}. ${it.name}${variant}${addOns}${note}\n   ${it.quantity} × ${formatRupiah(unit)} = ${formatRupiah(sub)}`
    })
    .join("\n")

  const alamat =
    order.customer.orderType === "antar"
      ? `Alamat  : ${order.customer.address}${order.customer.addressNote ? ` (${order.customer.addressNote})` : ""}`
      : `Alamat  : — (Ambil Sendiri)`

  const ongkir =
    order.deliveryFee === null
      ? "Ongkir   : dikonfirmasi admin"
      : `Ongkir   : ${formatRupiah(order.deliveryFee)}`

  const metode = { qris: "QRIS (DANA / BCA / GoPay)", transfer: "Transfer Bank BCA", tunai: "Tunai / COD" }[
    order.paymentMethod
  ]

  return [
    `🍽️ *PESANAN BARU — MAU'S KITCHEN*`,
    `Kode Pesanan: *${order.code}*`,
    `📅 ${tanggal} WIB`,
    ``,
    `👤 *DATA PEMESAN*`,
    `Nama    : ${order.customer.name}`,
    `WhatsApp: ${order.customer.whatsapp}`,
    `Tipe    : ${order.customer.orderType === "antar" ? "Antar" : "Ambil Sendiri"}`,
    alamat,
    `Waktu   : ${order.customer.scheduledAt ? new Date(order.customer.scheduledAt).toLocaleString("id-ID") : "Secepatnya"}`,
    ``,
    `🛒 *RINCIAN PESANAN*`,
    items,
    ``,
    `Subtotal : ${formatRupiah(order.subtotal)}`,
    ongkir,
    `*TOTAL   : ${formatRupiah(order.total)}*`,
    ``,
    `💳 *PEMBAYARAN*`,
    `Metode: ${metode}`,
    `Status: ${order.paymentMethod === "tunai" ? "Bayar di tempat" : "Menunggu pembayaran"}`,
    ...(order.customer.note ? [``, `📝 *CATATAN*`, order.customer.note] : []),
    ``,
    `— Dikirim otomatis dari website MAU'S Kitchen`,
  ].join("\n")
}

export const buildWhatsAppUrl = (message: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
```

---

## 13.3 Template pesan lain

### Konfirmasi sudah bayar (dari halaman pembayaran)

```
✅ *KONFIRMASI PEMBAYARAN*
Kode Pesanan: *MK-260814-001*
Total: Rp118.007
Metode: QRIS

Halo admin, saya sudah melakukan pembayaran.
Bukti transfer saya kirim setelah pesan ini ya 🙏
```

### Tanya menu / tanya umum (tombol FAB WhatsApp)

```
Halo MAU'S Kitchen 👋
Saya mau tanya-tanya soal menu.
```

### Tanya produk tertentu (dari halaman detail produk)

```
Halo MAU'S Kitchen 👋
Saya mau tanya soal *Choco Berry Grape*.
Link: https://mauskitchen.com/produk/choco-berry-grape
```

---

## 13.4 Aturan teknis penting

| Aturan | Penjelasan |
|---|---|
| Gunakan `encodeURIComponent` | Wajib, agar baris baru & emoji tidak rusak |
| Batas panjang URL | Aman di bawah ~2000 karakter. Jika pesanan sangat panjang, ringkas jadi "dan N item lainnya" + arahkan ke `/pesanan/[kode]` |
| Format tebal WhatsApp | `*teks*` (satu bintang), bukan Markdown `**teks**` |
| Baris baru | Gunakan `\n`, jangan `<br>` |
| Buka link | `window.open(url, "_blank", "noopener,noreferrer")` |
| Popup blocker | Panggil `window.open` **langsung di event handler klik**, jangan setelah `await` |
| Fallback | Sediakan tombol "Salin pesan" bila WhatsApp gagal terbuka |
| `wa.me` vs `api.whatsapp.com` | Gunakan `wa.me`, lebih andal di mobile |

### Pola aman untuk membuka WhatsApp setelah request API

```ts
const handleSubmit = async (values: CheckoutValues) => {
  // 1. Buka tab kosong LEBIH DULU (masih dalam konteks klik user)
  const waTab = window.open("", "_blank", "noopener,noreferrer")

  try {
    const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify(values) })
    const json = await res.json()

    if (!json.success) throw new Error(json.message)

    // 2. Arahkan tab yang sudah terbuka
    if (waTab) waTab.location.href = json.data.whatsappUrl
    clearCart()
    router.push(json.data.paymentUrl)
  } catch (e) {
    waTab?.close()
    toast.error("Gagal membuat pesanan. Coba lagi ya.")
  }
}
```

---

## 13.5 Notifikasi otomatis ke admin (opsional, Fase 3)

Jika ingin pesanan masuk otomatis tanpa pelanggan menekan tombol kirim:

| Opsi | Biaya | Catatan |
|---|---|---|
| WhatsApp Cloud API (Meta resmi) | Gratis untuk sejumlah percakapan/bulan | Butuh verifikasi bisnis & template disetujui |
| Fonnte / Wablas (penyedia lokal) | Mulai puluhan ribu/bulan | Mudah dipasang, tidak resmi Meta |
| Telegram Bot sebagai kanal admin | Gratis | Alternatif termurah jika admin bersedia pakai Telegram |
| Email notifikasi (Resend) | Gratis (tier awal) | Cadangan jika WhatsApp gagal |

Rekomendasi: mulai dari deeplink manual (Fase 1). Naik ke otomatisasi hanya bila
volume pesanan sudah membuat proses manual terasa berat.

---

## 13.6 Klik-untuk-chat di elemen lain

| Lokasi | Aksi |
|---|---|
| FAB mengambang | Chat umum |
| Footer | Nomor WhatsApp bisa diklik |
| Halaman kontak | Tombol besar "Chat via WhatsApp" |
| Detail produk | "Tanya produk ini" |
| Halaman pembayaran | "Kirim bukti bayar" |
| Halaman pesanan | "Tanya status pesanan" |

---

➡️ Lanjut ke `14_ADMIN_DASHBOARD.md`
