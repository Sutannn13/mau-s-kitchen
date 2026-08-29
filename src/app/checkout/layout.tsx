import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Pesanan",
  description:
    "Lengkapi data pemesanan MAU'S Kitchen. Pesanan langsung terkirim otomatis ke WhatsApp admin.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
