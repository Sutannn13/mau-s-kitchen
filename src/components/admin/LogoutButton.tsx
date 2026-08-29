"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

// Logout admin: hapus sesi Supabase lalu kembali ke halaman login.
export function LogoutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
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
      aria-label={iconOnly ? "Keluar" : undefined}
      aria-busy={isBusy || undefined}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60",
        iconOnly
          ? "justify-center px-0"
          : "px-4 text-brown/80 hover:bg-gold/15 hover:text-brown-deep",
        className,
      )}
    >
      <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
      {iconOnly ? null : isBusy ? "Keluar…" : "Keluar"}
    </button>
  );
}
