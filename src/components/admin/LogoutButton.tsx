"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

// Logout admin: hapus sesi Supabase lalu kembali ke halaman login.
export function LogoutButton() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsBusy(true);
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );
      await supabase.auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleLogout();
      }}
      disabled={isBusy}
      className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-brown/80 transition-colors hover:bg-gold/15 hover:text-brown-deep disabled:opacity-60"
    >
      <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
      {isBusy ? "Keluar…" : "Keluar"}
    </button>
  );
}
