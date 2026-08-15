"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Auto-refresh daftar pesanan tiap 30 detik (docs/14 §14.2); berhenti saat
// tab tidak terlihat agar tidak memboroskan kuota admin di lapangan.
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
