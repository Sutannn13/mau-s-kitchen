"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Auto-refresh daftar pesanan/dashboard (docs/14 §14.2) + indikator
// "terakhir diperbarui" (A11). Berhenti saat tab tidak terlihat agar tidak
// membosankan kuota admin di lapangan. Kegagalan refresh (soft-fail) hanya
// menampilkan saran muat ulang — tidak melempar error.
// Catatan a11y: timestamp TIDAK dijadikan live region (bertahap tiap interval
// akan bising bagi pembaca layar); hanya kegagalan yang diumumkan (role=alert).
// silent=true: refresh tetap jalan tetapi indikator teks tidak dirender
// (dashboard premium — permintaan pemilik 2026-08-23).
export function AutoRefresh({
  intervalMs = 30_000,
  silent = false,
}: {
  intervalMs?: number;
  silent?: boolean;
}) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [failed, setFailed] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    // Stempel awal lewat setTimeout(0): menghindari setState sinkron di badan
    // effect (react-hooks/set-state-in-effect) sekaligus mencegah mismatch
    // hidrasi — teks waktu hanya muncul pasca-hidrasi klien.
    const initialStamp = window.setTimeout(() => {
      setLastRefresh(new Date());
    }, 0);

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" || busyRef.current) {
        return;
      }
      busyRef.current = true;
      try {
        router.refresh();
        setLastRefresh(new Date());
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        busyRef.current = false;
      }
    }, intervalMs);

    return () => {
      window.clearTimeout(initialStamp);
      window.clearInterval(timer);
    };
  }, [router, intervalMs]);

  if (silent || lastRefresh === null) {
    return null;
  }

  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(lastRefresh);

  return (
    <p className="text-xs text-brown/55">
      {failed ? (
        <span role="alert" className="font-semibold text-chili">
          Pembaruan otomatis gagal — muat ulang halaman bila data terasa basi.
        </span>
      ) : (
        <span>
          Data diperbarui otomatis · terakhir pukul {time} WIB
        </span>
      )}
    </p>
  );
}
