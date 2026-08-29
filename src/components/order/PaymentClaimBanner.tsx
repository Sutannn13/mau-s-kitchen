import { KitchenLoader } from "@/components/common/KitchenLoader";

// Banner di /pesanan/[kode] saat pelanggan sudah menekan "Saya Sudah Bayar"
// tetapi admin belum mengubah status (masih BARU). Loader dapur dipakai ulang
// agar bahasa visual "sedang menunggu" konsisten dengan halaman pembayaran.
// Server component: hilang sendiri saat OrderLiveTracker memicu refresh RSC
// setelah status berpindah ke DIKONFIRMASI.
export function PaymentClaimBanner({ proofSubmitted }: { proofSubmitted: boolean }) {
  return (
    <section className="mt-5 rounded-2xl border border-gold/25 bg-cream-soft p-5 shadow-warm">
      <KitchenLoader label="Menunggu konfirmasi admin" />
      <p className="mt-3 text-center text-sm font-bold text-brown-deep">
        Kamu sudah menandai pesanan ini dibayar
      </p>
      <p className="mt-1 text-center text-xs leading-5 text-brown/80">
        {proofSubmitted
          ? "Bukti bayar sudah kami terima. Admin sedang memverifikasi pembayaranmu."
          : "Admin sedang memverifikasi pembayaranmu. Siapkan bukti bayar bila admin memintanya."}
      </p>
    </section>
  );
}
