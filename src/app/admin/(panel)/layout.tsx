import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { DatabaseZap } from "lucide-react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSessionRefresher } from "@/components/admin/AdminSessionRefresher";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MotionProvider } from "@/components/admin/MotionProvider";
import {
  hasAdminAuthorizationConfigured,
  hasServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { verifyAdminSession } from "@/lib/supabase/auth";

// Dashboard admin harus selalu segar dan terproteksi (docs/09 §9.6).
export const dynamic = "force-dynamic";

// Tampilan saat env Supabase belum diisi: panduan jujur, bukan error.
function SetupNeeded(): ReactNode {
  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-12 md:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-gold/25 bg-cream-soft p-6 text-center shadow-warm md:p-8">
        <DatabaseZap
          aria-hidden="true"
          className="mx-auto size-12 text-gold"
          strokeWidth={1.5}
        />
        <h1 className="mt-4 font-serif text-2xl font-bold text-brown-deep">
          Dashboard belum aktif
        </h1>
        <p className="mt-3 text-sm leading-6 text-brown/75">
          Dashboard admin membutuhkan Supabase. Jalani langkah 1–3 di{" "}
          <code className="rounded bg-gold/15 px-1.5 py-0.5 font-mono text-xs text-brown-deep">
            docs/19_SETUP_MANUAL.md
          </code>{" "}
          lalu isi tiga variabel Supabase di file{" "}
          <code className="rounded bg-gold/15 px-1.5 py-0.5 font-mono text-xs text-brown-deep">
            .env.local
          </code>
          .
        </p>
        <p className="mt-2 text-xs leading-5 text-brown/60">
          Demi keamanan, pemesanan tidak akan diterima sampai database dan
          otorisasi admin selesai dikonfigurasi.
        </p>
      </div>
    </main>
  );
}

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (
    !isSupabaseConfigured() ||
    !hasServiceRoleKey() ||
    !hasAdminAuthorizationConfigured()
  ) {
    return <SetupNeeded />;
  }

  // Autentikasi utama untuk rute admin (proxy lama dihapus karena runtime
  // Node.js-nya tidak didukung OpenNext Cloudflare). Verifikasi sesi di sini
  // adalah gerbang otorisasi tunggal.
  const cookieStore = await cookies();
  const session = await verifyAdminSession(() =>
    cookieStore.getAll().map(({ name, value }) => ({ name, value })),
  );

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminSessionRefresher />
      <AdminSidebar email={session.email} />
      {/* Sidebar desktop fixed; geser konten selebar sidebar (var --sidebar-w
          dikelola AdminSidebar agar padding ikut berubah saat sidebar
          menciut/melebar). Di seluler tidak ada offset (drawer menumpang). */}
      <div className="lg:pl-[var(--sidebar-w)] lg:transition-[padding-left] lg:duration-200 lg:ease-out">
        <AdminTopbar />
        <MotionProvider>{children}</MotionProvider>
      </div>
    </div>
  );
}
