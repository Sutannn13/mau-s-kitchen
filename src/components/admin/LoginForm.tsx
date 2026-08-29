"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Form login email+password Supabase Auth. Registrasi mandiri dimatikan di
// dashboard Supabase (docs/14 §14.1) — akun dibuat pemilik secara manual.
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsBusy(true);

    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Email atau password salah. Coba lagi ya.");
        return;
      }

      const authorization = await fetch("/api/admin/session", {
        cache: "no-store",
      });
      if (!authorization.ok) {
        await supabase.auth.signOut();
        setError("Akun ini tidak memiliki akses admin.");
        return;
      }

      router.replace("/admin/pesanan");
      router.refresh();
    } catch {
      setError("Gagal masuk. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="admin-email"
          className="block text-sm font-semibold text-brown-deep"
        >
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          className="mt-1.5 min-h-12 w-full rounded-xl border border-gold/30 bg-cream px-4 text-base text-brown-deep outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-semibold text-brown-deep"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          className="mt-1.5 min-h-12 w-full rounded-xl border border-gold/30 bg-cream px-4 text-base text-brown-deep outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-chili/10 px-4 py-3 text-sm text-chili">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isBusy}
        className="min-h-12 w-full rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {isBusy ? "Memproses…" : "Masuk"}
      </button>

      <p className="text-center text-xs leading-5 text-brown/60">
        Lupa password? Reset lewat menu Authentication di dashboard Supabase.
      </p>
    </form>
  );
}
