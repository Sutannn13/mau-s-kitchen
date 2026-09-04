import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseZap, Lock } from "lucide-react";

import { LoginForm } from "@/components/admin/LoginForm";
import {
  hasAdminAuthorizationConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Login Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const configured =
    isSupabaseConfigured() && hasAdminAuthorizationConfigured();

  return (
    <main className="min-h-screen bg-cream">
      {/* Panel brand gelap (md+) — split-screen premium ala halaman login
          SaaS modern; seluler hanya kartu form. */}
      <div
        className="hidden md:block"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, #241610 0%, #1d110b 55%, #140b07 100%)",
          clipPath: "polygon(0 0, 46% 0, 40% 100%, 0 100%)",
        }}
        aria-hidden="true"
      >
        <div className="absolute left-[12%] top-1/2 max-w-sm -translate-y-1/2">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold/70">
            MAU&apos;S Kitchen
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold leading-tight text-cream">
            Panel Admin
          </h2>
          <p className="mt-3 text-sm leading-7 text-cream/55">
            Kelola pesanan, menu, dan rekap penjualan — semua dari satu
            dasbor yang aman.
          </p>
        </div>
        <div
          className="absolute -left-16 top-16 size-64 rounded-full bg-gold/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-content items-center justify-center px-4 py-12 md:px-8">
        <div className="fade-up w-full max-w-md">
          <div className="au-card rounded-2xl p-6 shadow-luxe-lg md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gold/20">
              <Lock
                aria-hidden="true"
                className="size-6 text-brown-deep"
                strokeWidth={1.75}
              />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-bold text-brown-deep">
                Login Admin
              </h1>
              <p className="text-sm text-brown/70">Dashboard MAU&apos;S Kitchen</p>
            </div>
          </div>

          {configured ? (
            <LoginForm />
          ) : (
            <div className="mt-6 rounded-xl bg-gold/10 p-4 text-sm leading-6 text-brown-deep">
              <p className="flex items-center gap-2 font-semibold">
                <DatabaseZap
                  aria-hidden="true"
                  className="size-4 text-gold"
                  strokeWidth={1.75}
                />
                Supabase belum dikonfigurasi
              </p>
              <p className="mt-2 text-brown/75">
                Ikuti langkah 1–3 pada{" "}
                <code className="rounded bg-gold/20 px-1.5 py-0.5 font-mono text-xs">
                  docs/19_SETUP_MANUAL.md
                </code>{" "}
                lalu isi variabel{" "}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                dan{" "}
                <code className="font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
                , serta <code className="font-mono text-xs">ADMIN_EMAILS</code>
                .
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-brown/70">
          <Link href="/" className="underline transition-colors hover:text-brown-deep">
            Kembali ke situs pelanggan
          </Link>
        </p>
      </div>
    </div>
    </main>
  );
}
