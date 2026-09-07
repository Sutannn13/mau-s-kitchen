import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  description:
    "Lacak status pesanan kamu dengan kode pesanan MAU'S Kitchen.",
};

export default function PesananLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
