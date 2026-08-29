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
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-12 md:px-8">
      <div className="mx-auto max-w-md">
        <div className="fade-up rounded-2xl border border-gold/25 bg-cream-soft p-6 shadow-warm md:p-8">
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
    </main>
  );
}
