import { BarChart3 } from "lucide-react";

import {
  RekapFilters,
  type RekapPreset,
} from "@/components/admin/RekapFilters";
import { RekapDownloadButtons } from "@/components/admin/RekapDownloadButtons";
import { AdminPageHeader, StatTile } from "@/components/admin/primitives";
import { getRekapData } from "@/lib/admin/orders";
import { formatRupiah } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/whatsapp";
import type { PaymentMethod } from "@/types/order";

interface RekapPageProps {
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

function resolveRange(
  preset: RekapPreset,
  dariParam: string,
  sampaiParam: string,
): { dari: string; sampai: string } {
  const today = jakartaToday();
  if (preset === "custom") {
    return {
      dari: DATE_PATTERN.test(dariParam) ? dariParam : today,
      sampai: DATE_PATTERN.test(sampaiParam) ? sampaiParam : today,
    };
  }
  if (preset === "7-hari") {
    const start = new Date(`${today}T00:00:00+07:00`);
    start.setUTCDate(start.getUTCDate() - 6);
    return { dari: start.toISOString().slice(0, 10), sampai: today };
  }
  if (preset === "bulan-ini") {
    return { dari: `${today.slice(0, 7)}-01`, sampai: today };
  }
  return { dari: today, sampai: today };
}

const methodOrder: PaymentMethod[] = ["qris", "transfer", "tunai"];

export default async function AdminRekapPage({ searchParams }: RekapPageProps) {
  const params = await searchParams;
  const presetParam = first(params.periode);
  const preset: RekapPreset =
    presetParam === "7-hari" ||
    presetParam === "bulan-ini" ||
    presetParam === "custom"
      ? presetParam
      : "hari-ini";

  const { dari, sampai } = resolveRange(
    preset,
    first(params.dari),
    first(params.sampai),
  );

  const rekap = await getRekapData(dari, sampai);

  const metrics = rekap
    ? [
        { label: "Total pesanan", value: String(rekap.totalPesanan) },
        { label: "Pesanan selesai", value: String(rekap.pesananSelesai) },
        { label: "Pesanan batal", value: String(rekap.pesananBatal) },
        { label: "Omzet (SELESAI)", value: formatRupiah(rekap.omzet) },
        {
          label: "Rata-rata per transaksi",
          value: formatRupiah(rekap.rataRataTransaksi),
        },
      ]
    : [];

  return (
    <main className="stagger-in mx-auto w-full max-w-content px-4 pb-16 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <AdminPageHeader
          title="Rekap Penjualan"
          desc="Omzet hanya menghitung pesanan berstatus SELESAI. Zona waktu Asia/Jakarta."
        />

        <div className="au-card mt-4 rounded-2xl p-4">
          <RekapFilters preset={preset} dari={dari} sampai={sampai} />
        </div>

        {rekap === null ? (
          <div className="au-card mt-6 flex flex-col items-center rounded-2xl py-12 text-center">
            <BarChart3
              aria-hidden="true"
              className="size-10 text-gold"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm font-semibold text-brown-deep">
              Database belum dikonfigurasi.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-brown-deep">
                Periode {rekap.dari} s.d. {rekap.sampai}
              </p>
              <RekapDownloadButtons rekap={rekap} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
              {metrics.map((metric) => (
                <StatTile
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </dl>

            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
                Menu Terlaris
              </h2>
              {rekap.itemTerlaris.length === 0 ? (
                <p className="au-card mt-2 rounded-2xl p-4 text-sm text-brown/70">
                  Belum ada penjualan pada periode ini.
                </p>
              ) : (
                <ol className="au-card mt-3 divide-y divide-gold/15 rounded-2xl">
                  {rekap.itemTerlaris.map((item, index) => (
                    <li
                      key={item.itemId}
                      className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm"
                    >
                      <span className="font-semibold text-brown-deep">
                        {index + 1}. {item.name}
                      </span>
                      <span className="font-bold tabular-nums text-gold">
                        {item.qty} terjual
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brown/60">
                Metode Pembayaran
              </h2>
              <ul className="mt-3 grid grid-cols-3 gap-3">
                {methodOrder.map((method) => (
                  <li
                    key={method}
                    className="au-card au-card-hover rounded-2xl p-4 text-center"
                  >
                    <p className="text-xs font-semibold text-brown/60">
                      {paymentMethodLabels[method].split(" (")[0]}
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-brown-deep">
                      {rekap.perMetodeBayar[method]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
