"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { History, MessageCircle } from "lucide-react";

import { formatRupiah } from "@/lib/format";
import {
  useOrderHistory,
  useOrderHistoryHydrated,
  useRehydrateOrderHistory,
} from "@/lib/order-history-store";
import {
  buildRecoveryOrderUrl,
  findRecoveryEntry,
  isValidRecoveryToken,
  parseOrderScopeCode,
  shouldRecoverRedirect,
} from "@/lib/order-recovery";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// Pemulihan akses pesanan di halaman not-found rute pelanggan: cari token
// dari riwayat pesanan di perangkat ini lalu alihkan otomatis bila ketemu;
// kalau tidak, tawarkan daftar pesanan terakhir + chat admin
// (docs/04_BUSINESS_FLOW.md §4.4). Semua fase di-derive dari state —
// effect hanya menjalankan navigasi. Token riwayat yang sama persis
// dengan token di URL tidak dialihkan lagi supaya tidak berulang ke
// not-found.
export function OrderAccessRecovery() {
  useRehydrateOrderHistory();
  const hydrated = useOrderHistoryHydrated();
  const historyOrders = useOrderHistory((state) => state.orders);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const scopeCode = parseOrderScopeCode(pathname ?? "");
  const urlToken = searchParams.get("token") ?? "";
  const entry =
    scopeCode === null
      ? null
      : findRecoveryEntry(historyOrders, scopeCode.code);
  const shouldRedirect =
    scopeCode !== null &&
    entry !== null &&
    shouldRecoverRedirect(entry, urlToken);

  useEffect(() => {
    if (!hydrated || !shouldRedirect || scopeCode === null || entry === null) {
      return;
    }
    window.location.replace(
      buildRecoveryOrderUrl(scopeCode.scope, entry.code, entry.token),
    );
  }, [hydrated, shouldRedirect, scopeCode, entry]);

  if (!hydrated) {
    return (
      <p role="status" className="mt-6 text-sm text-brown/60">
        Memeriksa pesanan tersimpan di perangkat ini…
      </p>
    );
  }

  if (shouldRedirect) {
    return (
      <p role="status" className="mt-6 text-sm text-brown/60">
        Tautan pesanan ditemukan di perangkat ini — mengalihkan…
      </p>
    );
  }

  const code = scopeCode?.code ?? null;
  const recentOrders = historyOrders
    .filter(
      (historyEntry) =>
        isValidRecoveryToken(historyEntry.token) &&
        historyEntry.code !== code,
    )
    .slice(0, 3);

  const adminUrl = buildWhatsAppUrl(
    code
      ? `Halo MAU'S Kitchen 👋 Saya tidak bisa membuka halaman pesanan saya. Kode pesanan saya *${code}*. Mohon dibantu ya 🙏`
      : "Halo MAU'S Kitchen 👋 Saya butuh bantuan soal pesanan saya.",
  );

  return (
    <section className="mt-6 w-full max-w-md space-y-5">
      {code ? (
        <a
          href={adminUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-success px-6 text-sm font-bold text-white shadow-warm transition-colors hover:bg-success/90"
        >
          <MessageCircle aria-hidden="true" className="size-4" strokeWidth={2} />
          Hubungi Admin (kode {code})
        </a>
      ) : null}

      <div>
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brown/60">
          <History aria-hidden="true" className="size-4" strokeWidth={2} />
          Pesanan di perangkat ini
        </p>
        {recentOrders.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recentOrders.map((historyEntry) => (
              <li key={historyEntry.code}>
                <Link
                  href={buildRecoveryOrderUrl(
                    "pesanan",
                    historyEntry.code,
                    historyEntry.token,
                  )}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-gold/30 bg-cream px-4 text-sm transition-colors hover:bg-gold/15"
                >
                  <span className="font-mono font-bold text-brown-deep">
                    {historyEntry.code}
                  </span>
                  <span className="text-xs text-brown/70">
                    {formatRupiah(historyEntry.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-center text-xs leading-5 text-brown/60">
            Tidak ada pesanan tersimpan di perangkat ini. Bila kamu memesan dari
            perangkat lain, buka tautan yang dikirim ke WhatsApp ya.
          </p>
        )}
      </div>
    </section>
  );
}
