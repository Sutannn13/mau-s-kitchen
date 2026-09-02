"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// OpenNext Cloudflare cannot run Next.js 16 Node Proxy yet, so one lightweight
// route-handler heartbeat persists rotated Supabase cookies for every admin page.
export function AdminSessionRefresher({
  intervalMs = 5 * 60_000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function refreshSession(): Promise<void> {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (active && response.status === 401) {
          router.replace("/admin/login");
          router.refresh();
        }
      } catch {
        // Network recovery is handled by the next heartbeat or navigation.
      }
    }

    void refreshSession();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    }, intervalMs);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, router]);

  return null;
}
