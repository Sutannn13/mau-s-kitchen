import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keranjang Belanja",
  description:
    "Periksa item pesanan kamu sebelum melanjutkan ke halaman buat pesanan.",
  robots: { index: false, follow: false },
};

export default function KeranjangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
