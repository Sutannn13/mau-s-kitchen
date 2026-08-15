import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { DatabaseZap } from "lucide-react";

import { AdminNav } from "@/components/admin/AdminNav";
import {
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
          Situs pelanggan tetap berjalan normal — pesanan sementara disimpan
          di memori server (Fase 1).
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
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return <SetupNeeded />;
  }

  // Middleware sudah menjaga rute ini; verifikasi ulang di layout sebagai
  // lapisan pertahanan kedua.
  const cookieStore = await cookies();
  const session = await verifyAdminSession(() =>
    cookieStore.getAll().map(({ name, value }) => ({ name, value })),
  );

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="pb-16">
      <AdminNav />
      {children}
    </div>
  );
}
