import Link from "next/link";
import {
  BarChart3,
  Banknote,
  Inbox,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  XCircle,
} from "lucide-react";

import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { CompletionRadialChart } from "@/components/admin/dashboard/CompletionRadialChart";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { PaymentDonutChart } from "@/components/admin/dashboard/PaymentDonutChart";
import type { PaymentSlice } from "@/components/admin/dashboard/PaymentDonutChart";
import { paymentMethodColors } from "@/components/admin/dashboard/palette";
import { PeriodeSwitcher } from "@/components/admin/dashboard/PeriodeSwitcher";
import type { PeriodePreset } from "@/components/admin/dashboard/PeriodeSwitcher";
import { RevenueAreaChart } from "@/components/admin/dashboard/RevenueAreaChart";
import { getDailySeries, getRekapData, getTodayStats } from "@/lib/admin/orders";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paymentMethodLabels } from "@/lib/whatsapp";
import type { PaymentMethod } from "@/types/order";

// Dashboard analitik admin (docs/14 §14.0). Tampilan ringkas dengan kurva,
// lingkaran persen, dan ringkasan operasional. Omzet hanya menghitung
// pesanan SELESAI; zona waktu Asia/Jakarta (dipastikan di lib/admin/orders).

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const methodOrder: PaymentMethod[] = ["qris", "transfer", "tunai"];

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

// Formatkan instan Date menjadi tanggal kalender Jakarta (YYYY-MM-DD) —
// lebih aman daripada toISOString().slice(0,10) yang bisa geser sehari
// akibat perbedaan zona UTC vs +07:00.
function jakartaFormat(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Geser tanggal Jakarta (YYYY-MM-DD) sebanyak deltaDays, kembalikan tetap
// dalam zona Asia/Jakarta.
function shiftJakartaDate(date: string, deltaDays: number): string {
  const d = new Date(`${date}T00:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return jakartaFormat(d);
}

// Rentang tanggal inklusif (jumlah hari) untuk dua tanggal Jakarta.
function daySpan(dari: string, sampai: string): number {
  const a = new Date(`${dari}T00:00:00+07:00`).getTime();
  const b = new Date(`${sampai}T00:00:00+07:00`).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

function resolvePeriode(
  preset: PeriodePreset,
): { dari: string; sampai: string } {
  const today = jakartaToday();
  if (preset === "hari-ini") {
    return { dari: today, sampai: today };
  }
  if (preset === "bulan-ini") {
    return { dari: `${today.slice(0, 7)}-01`, sampai: today };
  }
  // 7 hari terakhir, inklusif hari ini (hari ini + 6 hari sebelumnya).
  return { dari: shiftJakartaDate(today, -6), sampai: today };
}

// Periode pembanding: jendela panjang sama tepat sebelum periode kini.
//  - hari-ini  -> kemarin
//  - 7-hari    -> 7 hari langsung sebelum jendela kini
//  - bulan-ini  -> hari ke-1 s.d. ke-N bulan lalu (N = jumlah hari berlalu
//                 bulan ini) agar pembandingnya setara, bukan bulan penuh.
function resolvePeriodeSebelumnya(
  preset: PeriodePreset,
  dari: string,
  sampai: string,
): { dari: string; sampai: string } {
  if (preset === "bulan-ini") {
    // Akhir bulan lalu = satu hari sebelum tanggal 1 bulan ini.
    const prevSampai = shiftJakartaDate(`${dari.slice(0, 7)}-01`, -1);
    const span = daySpan(dari, sampai);
    return { dari: shiftJakartaDate(prevSampai, -(span - 1)), sampai: prevSampai };
  }
  const span = daySpan(dari, sampai);
  const prevSampai = shiftJakartaDate(dari, -1);
  return { dari: shiftJakartaDate(prevSampai, -(span - 1)), sampai: prevSampai };
}

// Persen perubahan periode kini vs periode sebelumnya. null bila periode
// sebelumnya nol (tidak ada pembanding) — ditampilkan sebagai "baru".
function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

interface PanelCardProps {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function PanelCard({
  title,
  desc,
  action,
  children,
  className,
}: PanelCardProps) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-2xl border border-gold/15 bg-cream-soft p-5 shadow-warm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-gold/15 pb-3">
        <div>
          <h2 className="font-serif text-lg font-bold tracking-tight text-brown-deep">
            {title}
          </h2>
          {desc ? (
            <p className="mt-1 text-xs leading-5 text-brown/60">{desc}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const periodeParam = first(params.periode);
  const periode: PeriodePreset =
    periodeParam === "hari-ini" ||
    periodeParam === "7-hari" ||
    periodeParam === "bulan-ini"
      ? periodeParam
      : "7-hari";

  const { dari, sampai } = resolvePeriode(periode);
  const prev = resolvePeriodeSebelumnya(periode, dari, sampai);

  const [rekap, daily, hariIni, prevRekap] = await Promise.all([
    getRekapData(dari, sampai),
    getDailySeries(dari, sampai),
    getTodayStats(),
    getRekapData(prev.dari, prev.sampai),
  ]);

  // SetupNeeded di (panel)/layout.tsx sudah memblokir render saat Supabase
  // belum dikonfigurasi; tetap tangani null secara defensif agar dashboard
  // tidak crash bila hasil sumber data tidak tersedia.
  if (rekap === null || daily === null) {
    return (
      <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-gold/20 bg-cream-soft p-8 text-center shadow-warm">
          <BarChart3
            aria-hidden="true"
            className="mx-auto size-12 text-gold"
            strokeWidth={1.5}
          />
          <h1 className="mt-4 font-serif text-2xl font-bold text-brown-deep">
            Data dashboard belum tersedia
          </h1>
          <p className="mt-3 text-sm leading-6 text-brown/70">
            Ringkasan tidak dapat dimuat saat ini. Coba muat ulang halaman
            beberapa saat lagi.
          </p>
        </div>
      </main>
    );
  }

  const completionPercent =
    rekap.totalPesanan > 0
      ? Math.round((rekap.pesananSelesai / rekap.totalPesanan) * 100)
      : 0;

  const paymentSlices: PaymentSlice[] = methodOrder.map((method) => {
    const fullLabel = paymentMethodLabels[method];
    const label = fullLabel.split(" (")[0] ?? fullLabel;
    return {
      label,
      count: rekap.perMetodeBayar[method],
          color: paymentMethodColors[method],
    };
  });

  const menunggu = hariIni?.menungguKonfirmasi ?? 0;

  const batalPercent =
    rekap.totalPesanan > 0
      ? Math.round((rekap.pesananBatal / rekap.totalPesanan) * 100)
      : 0;

  // Perbandingan vs periode sebelumnya (docs/14 §14.0). Jika periode
  // sebelumnya nihil (tidak ada data), growthPercent mengembalikan null dan
  // kartu menampilkan label "baru".
  const omzetTrend = {
    delta: growthPercent(rekap.omzet, prevRekap?.omzet ?? 0),
  };
  const pesananTrend = {
    delta: growthPercent(rekap.totalPesanan, prevRekap?.totalPesanan ?? 0),
  };
  const rataTrend = {
    delta: growthPercent(
      rekap.rataRataTransaksi,
      prevRekap?.rataRataTransaksi ?? 0,
    ),
  };

  return (
    <main className="mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8">
      <AutoRefresh intervalMs={60_000} silent />

      {/* Judul + pemilih periode */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm leading-6 text-brown/70">
            Ringkasan kinerja MAU&apos;S Kitchen. Zona waktu Asia/Jakarta
            (WIB).{" "}
            <span className="text-brown/45">
              Diperbarui otomatis tiap 60 detik.
            </span>
          </p>
        </div>
        <PeriodeSwitcher active={periode} />
      </div>

      {/* KPI + banner + chart — key=periode agar remount + fade setiap
          ganti periode (AnimatedSection), chart recharts ikut replay;
          stagger-in membuat KPI & panel chart masuk berurutan, dan semua
          angka KPI di-count-up ulang. */}
      <AnimatedSection key={periode}>
      {/* KPI periode — ala Meta Ads Manager: count-up + sparkline mini
          (omzet/pesanan/rata-rata) dan ring persen untuk batal. Wrapper
          div per kartu: stagger animasi di wrapper, hover lift di kartu. */}
      <div className="stagger-in mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div>
          <KpiCard
            label="Omzet periode"
            value={rekap.omzet}
            format="rupiah"
            hint="Hanya pesanan SELESAI"
            icon={<Wallet className="size-5" strokeWidth={1.75} />}
            trend={omzetTrend}
            sparkline={daily.map((point) => point.omzet)}
            sparklineColor="#C79A4B"
          />
        </div>
        <div>
          <KpiCard
            label="Total pesanan"
            value={rekap.totalPesanan}
            hint={`Periode ${dari} s.d. ${sampai}`}
            icon={<Inbox className="size-5" strokeWidth={1.75} />}
            trend={pesananTrend}
            sparkline={daily.map((point) => point.pesanan)}
            sparklineColor="#6B4226"
          />
        </div>
        <div>
          <KpiCard
            label="Rata-rata per transaksi"
            value={rekap.rataRataTransaksi}
            format="rupiah"
            hint="Dari pesanan selesai"
            icon={<Banknote className="size-5" strokeWidth={1.75} />}
            trend={rataTrend}
            sparkline={daily.map((point) =>
              point.pesanan > 0 ? Math.round(point.omzet / point.pesanan) : 0,
            )}
            sparklineColor="#8A9A3B"
          />
        </div>
        <div>
          <KpiCard
            label="Pesanan batal"
            value={rekap.pesananBatal}
            hint={rekap.totalPesanan > 0 ? `${batalPercent}% dari total` : undefined}
            icon={<XCircle className="size-5" strokeWidth={1.75} />}
            tone="muted"
            ringPercent={batalPercent}
          />
        </div>
      </div>

      {/* Banner operasional — ditempatkan setelah KPI (permintaan pemilik
          2026-08-23). Grid 2 kolom di desktop (mobile stack): kiri pill
          live indikator + judul + CTA, kanan mini-stats. Pill berdenyut
          (animate-ping, dimatikan jaring reduce-motion): pistachio saat
          aman, chili saat ada yang menunggu konfirmasi. */}
      <section className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-choco to-brown-deep p-5 text-cream shadow-warm-lg ring-1 ring-gold/20 md:p-6 lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ring-1 ring-inset",
              menunggu > 0
                ? "bg-chili/15 text-chili ring-chili/30"
                : "bg-pistachio/15 text-pistachio ring-pistachio/30",
            )}
          >
            <span className="relative flex size-2">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  menunggu > 0 ? "bg-chili" : "bg-pistachio",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  menunggu > 0 ? "bg-chili" : "bg-pistachio",
                )}
              />
            </span>
            Status Hari Ini
          </span>
          <p className="mt-3 font-serif text-xl font-bold text-cream md:text-2xl">
            {menunggu > 0
              ? `${menunggu} pesanan menunggu konfirmasi`
              : "Semua pesanan tertangani"}
          </p>
          <p className="mt-1 text-sm leading-6 text-cream/60">
            Ringkasan operasional hari ini — data zona waktu Asia/Jakarta.
          </p>
          <div className="mt-4">
            {menunggu > 0 ? (
              <Link
                href="/admin/pesanan?status=BARU"
                className="btn-press inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light"
              >
                Konfirmasi Sekarang
              </Link>
            ) : (
              <Link
                href="/admin/pesanan"
                className="btn-press inline-flex min-h-11 items-center rounded-full border border-gold/40 px-5 text-sm font-semibold text-cream transition-colors hover:bg-white/10"
              >
                Lihat Pesanan
              </Link>
            )}
          </div>
        </div>
        <dl className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:mt-0 lg:grid-cols-1 lg:gap-2">
          <div className="min-w-0 rounded-xl bg-white/5 p-2.5 ring-1 ring-inset ring-white/10 sm:p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-cream/55">
              <Inbox aria-hidden="true" className="size-3.5 text-gold/70" strokeWidth={2} />
              Pesanan hari ini
            </dt>
            <dd className="mt-1 text-base font-bold tabular-nums text-cream sm:text-lg">
              {hariIni?.totalHariIni ?? 0}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl bg-white/5 p-2.5 ring-1 ring-inset ring-white/10 sm:p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-cream/55">
              <UtensilsCrossed aria-hidden="true" className="size-3.5 text-gold/70" strokeWidth={2} />
              Sedang diproses
            </dt>
            <dd className="mt-1 text-base font-bold tabular-nums text-cream sm:text-lg">
              {hariIni?.sedangDiproses ?? 0}
            </dd>
          </div>
          <div className="col-span-2 min-w-0 rounded-xl bg-white/5 p-2.5 ring-1 ring-inset ring-white/10 sm:col-span-1 sm:p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-cream/55">
              <Wallet aria-hidden="true" className="size-3.5 text-gold/70" strokeWidth={2} />
              Omzet hari ini
            </dt>
            <dd className="mt-1 truncate text-base font-bold tabular-nums text-cream sm:text-lg">
              {formatRupiah(hariIni?.omzetHariIni ?? 0)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Kurva omzet + lingkaran persen penyelesaian — wrapper div per
          panel: stagger di wrapper, hover lift di PanelCard. */}
      <div className="stagger-in mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelCard
            title="Tren Omzet & Pesanan"
            desc="Omzet (SELESAI) harian dan jumlah pesanan pada periode terpilih."
          >
            <RevenueAreaChart data={daily} />
          </PanelCard>
        </div>
        <div>
          <PanelCard
            title="Tingkat Penyelesaian"
            desc="Persentase pesanan yang berstatus SELESAI pada periode."
          >
            <CompletionRadialChart percent={completionPercent} />
            <div className="mt-2 flex items-center justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-brown/70">
                <TrendingUp className="size-4 text-gold" strokeWidth={1.75} />
                {rekap.pesananSelesai} selesai
              </span>
              <span className="text-brown/50">
                dari {rekap.totalPesanan} pesanan
              </span>
            </div>
          </PanelCard>
        </div>
      </div>

      {/* Menu terlaris + donut metode pembayaran — wrapper div per panel. */}
      <div className="stagger-in mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
        <PanelCard
          title="Menu Terlaris"
          desc="5 item teratas berdasarkan jumlah porsi/cup terjual pada periode."
          className="lg:col-span-2"
        >
          {rekap.itemTerlaris.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gold/25 bg-white/30 p-4 text-sm text-brown/55">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {rekap.itemTerlaris.map((item, index) => {
                const maxQty =
                  rekap.itemTerlaris[0]?.qty || 1;
                const share = Math.round((item.qty / maxQty) * 100);
                return (
                  <li key={item.itemId} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/15 font-serif text-sm font-bold text-gold"
                    >
                      {index + 1}
                    </span>
                    <span className="w-28 shrink-0 truncate text-sm font-semibold text-brown-deep sm:w-44">
                      {item.name}
                    </span>
                    <span className="hidden flex-1 overflow-hidden rounded-full bg-brown/8 sm:block">
                      <span
                        className="bar-grow block h-2 rounded-full bg-gold/70"
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="ml-auto tabular-nums text-sm font-bold text-brown-deep">
                      {item.qty}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </PanelCard>
        </div>
        <div>
          <PanelCard
            title="Metode Pembayaran"
            desc="Distribusi metode bayar pada periode."
          >
            <div className="flex h-full items-center">
              <PaymentDonutChart data={paymentSlices} />
            </div>
          </PanelCard>
        </div>
      </div>
      </AnimatedSection>

      <p className="mt-5 text-xs leading-5 text-brown/50">
        Omzet hanya menghitung pesanan berstatus SELESAI. Periode dihitung
        berdasarkan zona waktu Asia/Jakarta (WIB). Persentase perubahan
        membandingkan periode kini dengan periode panjang setara tepat
        sebelumnya.
      </p>
    </main>
  );
}
