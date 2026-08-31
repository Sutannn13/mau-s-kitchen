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

import { EmptyState } from "@/components/common/EmptyState";
import { EyebrowRule } from "@/components/common/EyebrowRule";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { formatRupiah } from "@/lib/format";
import {
  useOrderHistory,
  useOrderHistoryHydrated,
  useRehydrateOrderHistory,
  type OrderHistoryEntry,
} from "@/lib/order-history-store";
import { resolveOrderSearch } from "@/lib/order-recovery";
import {
  customerHistoryStepLabels,
  customerHistorySteps,
  getCustomerHistoryStepIndex,
  isOrderStatus,
  statusLabels,
} from "@/lib/order-status";
import { paymentMethodLabels } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

// Accent warna per status untuk bar kiri kartu
const statusAccents: Record<OrderStatus, string> = {
  BARU: "bg-flame",
  DIKONFIRMASI: "bg-gold",
  DIPROSES: "bg-gold-light",
  DIKIRIM: "bg-rose",
  SELESAI: "bg-pistachio",
  BATAL: "bg-chili",
};

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
  const [searchError, setSearchError] = useState("");
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
    const result = resolveOrderSearch(searchCode, orders, window.location.origin);
    if (result.ok) {
      setSearchError("");
      router.push(result.url);
      return;
    }
    if (result.reason === "empty") {
      setSearchError("Masukkan kode atau tautan privat pesanan.");
    } else if (result.reason === "missing-token") {
      setSearchError(
        "Kode ini tidak tersimpan di perangkat. Tempel tautan privat lengkap dari halaman checkout.",
      );
    } else {
      setSearchError("Kode atau tautan privat pesanan tidak valid.");
    }
  }

  return (
    <main className="bg-cream-soft pb-6 pt-4 md:pb-16 md:pt-10">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brown transition-colors hover:text-brown-deep"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Kembali ke Beranda
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <EyebrowRule />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown">
                Riwayat Pesanan
              </p>
            </div>
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

        {/* Search box di atas — user datang untuk cari kode */}
        <section className="mt-5 rounded-2xl border border-gold/20 bg-cream p-4 shadow-warm">
          <form onSubmit={handleSearch} noValidate>
            <label htmlFor="order-search" className="sr-only">
              Kode atau tautan privat pesanan
            </label>
            <div className="flex gap-2">
              <input
                id="order-search"
                type="text"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setSearchError("");
                }}
                maxLength={512}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby={
                  searchError
                    ? "order-search-help order-search-error"
                    : "order-search-help"
                }
                aria-invalid={searchError ? true : undefined}
                placeholder="Kode atau tautan privat pesanan"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-gold/30 bg-cream-soft px-4 font-mono text-sm text-brown-deep placeholder:font-sans placeholder:text-brown/40 focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                className="btn-press flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-brown-deep px-5 text-xs font-bold text-cream transition-colors hover:bg-brown"
              >
                <Search aria-hidden="true" className="size-3.5" strokeWidth={2} />
                Cari
              </button>
            </div>
            <p id="order-search-help" className="mt-2 text-xs leading-relaxed text-brown/65">
              Gunakan kode dari perangkat ini atau tempel tautan privat lengkap.
            </p>
            {searchError ? (
              <p
                id="order-search-error"
                role="alert"
                className="mt-1.5 text-xs font-semibold leading-relaxed text-chili"
              >
                {searchError}
              </p>
            ) : null}
          </form>
        </section>

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
          <div className="mt-6 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-gold/15 bg-cream shadow-warm">
                <div className="h-1.5 w-full bg-gold/20" />
                <div className="p-5">
                  <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                    <div className="space-y-2">
                      <div className="h-2.5 w-20 animate-pulse rounded bg-gold/20" />
                      <div className="h-4 w-32 animate-pulse rounded bg-brown/10" />
                    </div>
                    <div className="h-6 w-20 animate-pulse rounded-full bg-gold/20" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-brown/10" />
                    <div className="h-3 w-24 animate-pulse rounded bg-brown/10" />
                  </div>
                  <div className="mt-4 h-9 w-full animate-pulse rounded-full bg-gold/15" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const trackingUrl = `/pesanan/${order.code}?token=${encodeURIComponent(order.token)}`;
              const miniIdx = getCustomerHistoryStepIndex(order.status);
              const isBatal = order.status === "BATAL";

              return (
                <div
                  key={order.code}
                  className="relative overflow-hidden rounded-2xl border border-gold/20 bg-cream shadow-warm transition-all hover:border-gold/40 hover:shadow-warm-lg"
                >
                  {/* Accent bar status kiri */}
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 w-1.5",
                      statusAccents[order.status],
                    )}
                    aria-hidden="true"
                  />
                  <div className="p-5 pl-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/15 pb-3">
                      <div>
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brown/60">
                          Kode Pesanan
                        </p>
                        <span className="font-mono text-base font-bold text-brown-deep">
                          {order.code}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold",
                          isBatal
                            ? "bg-chili/15 text-chili"
                            : miniIdx === customerHistorySteps.length - 1
                              ? "bg-pistachio/15 text-success"
                              : "bg-gold/15 text-brown-deep",
                        )}
                      >
                        {statusLabels[order.status]}
                      </span>
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

                    {/* Mini timeline mengikuti status pengiriman secara eksplisit. */}
                    {!isBatal ? (
                      <div className="mt-4 flex items-center gap-1.5">
                        {customerHistorySteps.map((step, i) => {
                          const isDone = i < miniIdx;
                          const isCurrent = i === miniIdx;
                          return (
                            <div key={step} className="flex flex-1 items-center gap-1.5">
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors",
                                  isDone
                                    ? "bg-gold text-brown-deep"
                                    : isCurrent
                                      ? "border-2 border-gold bg-cream text-brown-deep"
                                      : "border border-gold/30 bg-cream text-brown/40",
                                )}
                              >
                                {isDone ? "✓" : i + 1}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-semibold",
                                  isDone || isCurrent ? "text-brown-deep" : "text-brown/40",
                                )}
                              >
                                {customerHistoryStepLabels[step]}
                              </span>
                              {i < customerHistorySteps.length - 1 ? (
                                <span className="h-px flex-1 bg-gold/20" aria-hidden="true" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        href={trackingUrl}
                        className="btn-press flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-gold px-4 text-xs font-bold text-brown-deep shadow-sm transition-colors hover:bg-gold-light"
                      >
                        Lihat Status &amp; Rincian
                        <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              headingLevel="h2"
              icon={<ShoppingBag className="size-8" strokeWidth={1.25} />}
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

        {/* Hubungi admin */}
        <div className="mt-8 text-center">
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
