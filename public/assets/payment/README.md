# Folder Aset Pembayaran

## qris.jpeg

Gambar QRIS statis resmi disimpan di sini dengan nama `qris.jpeg`.

**Spesifikasi:**
- Format: PNG atau JPG
- Resolusi aset saat ini: 908×1280px
- Pastikan kode QR bisa dipindai dengan jelas dari layar HP

QRIS aktif di lokal melalui `NEXT_PUBLIC_ENABLE_QRIS=true`. Untuk produksi,
aktifkan flag yang sama hanya setelah transaksi uji nominal kecil berhasil.

---

**Catatan keamanan:**
- QRIS statis artinya semua pelanggan scan QR yang sama
- Nominal transfer diinput manual oleh pelanggan
- Admin wajib cocokkan nominal + waktu transfer dengan pesanan
- Untuk auto-verifikasi, upgrade ke QRIS dinamis (Fase 3) via payment gateway
