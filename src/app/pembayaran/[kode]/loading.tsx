import { KitchenLoader } from "@/components/common/KitchenLoader";

// Loader tengah halaman untuk route pembayaran dinamis — mengambil data
// pesanan + instruksi bayar sebelum QRIS/transfer bisa dirender.
export default function LoadingPembayaran() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <KitchenLoader label="Menyiapkan pembayaran" />
    </main>
  );
}
