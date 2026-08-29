"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  History,
  MessageCircle,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { formatRupiah } from "@/lib/format";
import {
  useOrderHistory,
  useOrderHistoryHydrated,
  useRehydrateOrderHistory,
  type OrderHistoryEntry,
} from "@/lib/order-history-store";
import { isOrderStatus } from "@/lib/order-status";
import { paymentMethodLabels } from "@/lib/whatsapp";

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PesananListPage() {
  useRehydrateOrderHistory();
  const hydrated = useOrderHistoryHydrated();
  const orders = useOrderHistory((state) => state.orders);
  const clearHistory = useOrderHistory((state) => state.clear);
  const removeOrder = useOrderHistory((state) => state.removeOrder);
  const updateSnapshot = useOrderHistory((state) => state.updateSnapshot);
  const router = useRouter();

  const [searchCode, setSearchCode] = useState("");
  const [syncing, setSyncing] = useState(false);
  const syncStartedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || syncStartedRef.current) {
      return;
    }
    const pendingOrders = useOrderHistory.getState().orders;
    if (pendingOrders.length === 0) {
      return;
    }
    syncStartedRef.current = true;
    const controller = new AbortController();

    async function syncOrder(order: OrderHistoryEntry): Promise<void> {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(order.code)}?token=${encodeURIComponent(order.token)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (response.status === 404) {
          removeOrder(order.code);
          return;
        }
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as {
          success?: boolean;
          data?: { status?: unknown; total?: unknown };
        };
        const status = body.data?.status;
        const total = body.data?.total;
        if (
          body.success === true &&
          typeof status === "string" &&
          isOrderStatus(status) &&
          typeof total === "number" &&
          Number.isInteger(total) &&
          total >= 0
        ) {
          updateSnapshot(order.code, { status, total });
        }
      } catch {
        // Riwayat lokal tetap ditampilkan ketika jaringan sedang bermasalah.
      }
    }

    async function syncAllOrders(): Promise<void> {
      setSyncing(true);
      try {
        await Promise.all(pendingOrders.map(syncOrder));
      } finally {
        if (!controller.signal.aborted) {
          setSyncing(false);
        }
      }
    }
    void syncAllOrders();

    return () => {
      controller.abort();
    };
  }, [hydrated, removeOrder, updateSnapshot]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanCode = searchCode.trim().toUpperCase();
    if (!cleanCode) {
      return;
    }
    const matched = orders.find((o) => o.code.toUpperCase() === cleanCode);
    if (matched) {
      router.push(`/pesanan/${matched.code}?token=${encodeURIComponent(matched.token)}`);
    } else {
      router.push(`/pesanan/${cleanCode}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-6 pt-4 md:px-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Kembali ke Beranda
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
              Pesanan Saya
            </h1>
            <p className="mt-1 text-sm text-brown/70">
              Lacak status dan rincian pesanan yang pernah dibuat di perangkat ini.
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/15 text-brown-deep">
            <History aria-hidden="true" className="size-6" strokeWidth={1.75} />
          </div>
        </div>

        {hydrated && orders.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3">
            <p className="max-w-md text-xs leading-relaxed text-brown/75">
              Riwayat ini tersimpan di browser selama maksimal 30 hari. Hapus
              setelah selesai bila perangkat dipakai bersama.
            </p>
            <ConfirmButton
              onConfirm={clearHistory}
              label={
                <>
                  <Trash2 aria-hidden="true" className="size-4" />
                  Hapus Riwayat
                </>
              }
              confirmLabel="Ya, Hapus Semua"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-chili/30 px-4 text-xs font-semibold text-chili transition-colors hover:bg-chili/10"
            />
          </div>
        ) : null}

        {syncing ? (
          <p className="mt-3 flex items-center gap-2 text-xs font-medium text-brown/65">
            <RefreshCw aria-hidden="true" className="size-3.5 animate-spin" />
            Menyinkronkan status dan total terbaru...
          </p>
        ) : null}

        {!hydrated ? (
          <div className="mt-8 space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-cream-soft" />
            <div className="h-28 animate-pulse rounded-2xl bg-cream-soft" />
          </div>
        ) : orders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const trackingUrl = `/pesanan/${order.code}?token=${encodeURIComponent(order.token)}`;
              const paymentUrl = `/pembayaran/${order.code}?token=${encodeURIComponent(order.token)}`;
              const isUnpaidBaru =
                order.status === "BARU" && order.paymentMethod !== "tunai";

              return (
                <div
                  key={order.code}
                  className="rounded-2xl border border-gold/20 bg-cream-soft p-5 shadow-warm transition-all hover:border-gold/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/15 pb-3">
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brown/60">
                        Kode Pesanan
                      </p>
                      <span className="font-mono text-base font-bold text-brown-deep">
                        {order.code}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-brown/60">Waktu Pemesanan</span>
                      <p className="mt-0.5 font-semibold text-brown-deep">
                        {formatDateTime(order.createdAt)} WIB
                      </p>
                    </div>
                    <div>
                      <span className="text-brown/60">Total &amp; Metode</span>
                      <p className="mt-0.5 font-semibold text-brown-deep">
                        {formatRupiah(order.total)}{" "}
                        <span className="font-normal text-brown/70">
                          ({paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                    <Link
                      href={trackingUrl}
                      className="btn-press flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-gold px-4 text-xs font-bold text-brown-deep shadow-sm transition-colors hover:bg-gold-light"
                    >
                      Lihat Status &amp; Rincian
                      <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
                    </Link>
                    {isUnpaidBaru ? (
                      <Link
                        href={paymentUrl}
                        className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-gold/40 px-4 text-xs font-semibold text-brown transition-colors hover:bg-gold/15"
                      >
                        Instruksi Bayar
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              headingLevel="h2"
              icon={<ShoppingBag className="size-7" strokeWidth={1.5} />}
              title="Belum ada pesanan aktif"
              description="Kamu belum memiliki riwayat pesanan di perangkat ini. Yuk pesan menu favoritmu sekarang!"
              action={
                <Link
                  href="/menu"
                  className="btn-press flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
                >
                  Lihat Menu &amp; Pesan
                </Link>
              }
            />
          </div>
        )}

        {/* Cari kode pesanan manual */}
        <section className="mt-10 rounded-2xl border border-gold/20 bg-cream-soft p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-brown/70">
            Cari Kode Pesanan
          </h2>
          <p className="mt-1 text-xs leading-5 text-brown/70">
            Punya kode pesanan dari WhatsApp atau perangkat lain? Masukkan di bawah untuk melacak:
          </p>

          <form onSubmit={handleSearch} className="mt-3 flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="MK-260823-001"
              className="min-h-11 flex-1 rounded-xl border border-gold/30 bg-cream px-3.5 font-mono text-sm uppercase text-brown-deep placeholder:text-brown/40 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brown-deep px-5 text-xs font-bold text-cream transition-colors hover:bg-brown"
            >
              <Search aria-hidden="true" className="size-3.5" strokeWidth={2} />
              Cari
            </button>
          </form>
        </section>

        {/* Hubungi admin */}
        <div className="mt-6 text-center">
          <a
            href="https://wa.me/6281617691585?text=Halo%20MAU'S%20Kitchen%20%F0%9F%91%8B%20Saya%20mau%20tanya%20tentang%20pesanan%20saya"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 text-xs font-semibold text-brown transition-colors hover:text-brown-deep"
          >
            <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Butuh bantuan? Hubungi Admin WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
