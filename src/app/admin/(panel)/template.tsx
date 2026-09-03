// template.tsx di (panel) — TIDAK SAMA DENGAN layout.tsx: Next.js memount
// ulang template pada SETIAP navigasi antar route admin, jadi wrapper ini
// memberi transisi fade + rise halus tiap pindah halaman (Dashboard →
// Pesanan → Menu → Rekap), selaras dengan bahasa animasi dashboard.
// Children tetap server components — AnimatedSection menerima mereka
// sebagai props (pola yang sama dengan dashboard).
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";

export default function AdminPanelTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnimatedSection>{children}</AnimatedSection>;
}
