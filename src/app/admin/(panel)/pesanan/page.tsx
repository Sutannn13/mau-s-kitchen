import Link from "next/link";
import { BadgeCheck, Inbox, ReceiptText } from "lucide-react";

import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { OrderFilters } from "@/components/admin/OrderFilters";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { getTodayStats, listOrders } from "@/lib/admin/orders";
import { formatRupiah } from "@/lib/format";
import { isOrderStatus } from "@/lib/order-status";
import { paymentMethodLabels } from "@/lib/whatsapp";

interface PesananAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatJakartaTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminPesananPage({
  searchParams,
}: PesananAdminPageProps) {
  const params = await searchParams;

  const statusParam = first(params.status);
  const status = isOrderStatus(statusParam) ? statusParam : undefined;
  const rentang = first(params.rentang) || "hari-ini";
  const today = jakartaToday();
  const dariParam = first(params.dari);
  const sampaiParam = first(params.sampai);
  // Default filter: hari ini (docs/04 §4.5).
  const dari =
    rentang === "semua"
      ? undefined
      : DATE_PATTERN.test(dariParam)
        ? dariParam
        : today;
  const sampai =
    rentang === "semua"
      ? undefined
      : DATE_PATTERN.test(sampaiParam)
        ? sampaiParam
        : today;
  const q = first(params.q).trim();
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const [stats, result] = await Promise.all([
    getTodayStats(),
    listOrders({
      ...(status ? { status } : {}),
      ...(dari ? { dari } : {}),
      ...(sampai ? { sampai } : {}),
      ...(q ? { q } : {}),
      page,
      limit: 20,
    }),
  ]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / 20)) : 1;

  function pageHref(targetPage: number): string {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (dari) search.set("dari", dari);
    if (sampai) search.set("sampai", sampai);
    if (rentang) search.set("rentang", rentang);
    if (q) search.set("q", q);
    if (targetPage > 1) search.set("page", String(targetPage));
    const query = search.toString();
    return query ? `/admin/pesanan?${query}` : "/admin/pesanan";
  }

  const statCards = stats
    ? [
        { label: "Pesanan hari ini", value: String(stats.totalHariIni) },
        { label: "Menunggu konfirmasi", value: String(stats.menungguKonfirmasi) },
        { label: "Sedang diproses", value: String(stats.sedangDiproses) },
        { label: "Omzet hari ini", value: formatRupiah(stats.omzetHariIni) },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
      <AutoRefresh />

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
          Daftar Pesanan
        </h1>
        <span className="text-xs text-brown/60">Perbarui otomatis tiap 30 detik</span>
      </div>

      {statCards.length > 0 ? (
        <dl className="stagger-in mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="min-w-0 rounded-xl sm:rounded-2xl border border-gold/20 bg-cream-soft p-3 sm:p-4"
            >
              <dt className="text-[11px] sm:text-xs font-semibold text-brown/60 truncate">{card.label}</dt>
              <dd className="mt-1 text-base sm:text-xl font-bold tabular-nums text-brown-deep truncate">
                {card.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-4 rounded-2xl border border-gold/20 bg-cream-soft p-4">
        <OrderFilters
          currentRange={
            rentang === "hari-ini" ||
            rentang === "7-hari" ||
            rentang === "bulan-ini" ||
            rentang === "semua" ||
            rentang === "custom"
              ? rentang
              : "hari-ini"
          }
          currentDari={dari ?? today}
          currentSampai={sampai ?? today}
          currentStatus={status ?? ""}
          currentQuery={q}
        />
      </div>

      {result === null || result.orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-gold/20 bg-cream-soft py-12 text-center">
          <Inbox aria-hidden="true" className="size-10 text-gold" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-brown-deep">
            {result === null
              ? "Database belum dikonfigurasi."
              : "Tidak ada pesanan pada filter ini."}
          </p>
          {result !== null ? (
            <p className="mt-1 text-xs text-brown/60">
              Coba ubah rentang tanggal atau status.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {result.orders.map((order) => {
            const itemCount = order.items.reduce(
              (total, item) => total + item.quantity,
              0,
            );
            const awaitingVerification =
              Boolean(order.paymentClaimedAt) && order.status === "BARU";
            return (
              <li
                // Key menyertakan status + klaim bayar: perubahan salah satunya
                // me-remount kartu sehingga animasi card-update/card-new
                // memutar sekali — admin langsung tahu kartu mana yang berubah
                // di tengah auto-refresh 30 detik (docs/14 §14.2).
                key={`${order.code}-${order.status}-${awaitingVerification ? "claim" : "no-claim"}`}
                className={`rounded-2xl border p-4 ${
                  order.status === "BARU"
                    ? "animate-card-new border-flame/50 bg-flame/5"
                    : "animate-card-update border-gold/20 bg-cream-soft"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-base font-bold text-brown-deep">
                    {order.code}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {awaitingVerification ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                        <BadgeCheck
                          aria-hidden="true"
                          className="size-3.5"
                          strokeWidth={2.25}
                        />
                        Klaim sudah bayar
                      </span>
                    ) : null}
                    {order.paymentMethod === "tunai" && order.status === "BARU" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800">
                        ⚠️ Tunai (Konfirmasi WA)
                      </span>
                    ) : null}
                    {order.customer.scheduledAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-800">
                        🗓️ Jadwal: {formatJakartaTime(order.customer.scheduledAt)}
                      </span>
                    ) : null}
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-brown/75">
                  {formatJakartaTime(order.createdAt)} WIB · {order.customer.name} ·{" "}
                  {order.customer.orderType === "antar" ? "Antar" : "Ambil"}
                </p>
                <p className="mt-1 text-sm text-brown/75">
                  {itemCount} item · {formatRupiah(order.total)} ·{" "}
                  {paymentMethodLabels[order.paymentMethod]}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/admin/pesanan/${order.code}`}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
                  >
                    <ReceiptText
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.75}
                    />
                    Lihat Detail
                  </Link>
                  <StatusSelect
                    key={`${order.code}-${order.status}`}
                    code={order.code}
                    status={order.status}
                    paymentMethod={order.paymentMethod}
                    total={order.total}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {result !== null && totalPages > 1 ? (
        <nav
          aria-label="Navigasi halaman"
          className="mt-6 flex items-center justify-between"
        >
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-brown/70">
            Halaman {page} dari {totalPages} ({result.total} pesanan)
          </p>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
            >
              Berikutnya
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
