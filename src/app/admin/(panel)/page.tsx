import { redirect } from "next/navigation";

// /admin langsung dialihkan ke daftar pesanan (alur admin utama).
export default function AdminIndexPage(): never {
  redirect("/admin/pesanan");
}
