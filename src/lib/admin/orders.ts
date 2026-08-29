import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findOrderRowsByCode,
  getJakartaDayStartUtc,
  rowToOrder,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/order-db";
import { canTransition } from "@/lib/order-status";
import {
  isCashDeliveryProviderAllowed,
  isDeliveryPlanReady,
} from "@/lib/order-delivery";
import {
  calculateOrderTotal,
  canEditDeliveryFee,
  statusRequiresFinalTotal,
} from "@/lib/order-pricing";
import { getServiceClient } from "@/lib/supabase/admin";
import { getAuthorizedAdminServiceClient } from "@/lib/supabase/current-admin";
import type {
  DeliveryProvider,
  Order,
  OrderStatus,
  PaymentMethod,
} from "@/types/order";

// Semua fungsi di file ini hanya untuk dashboard admin dan wajib dipanggil
// setelah sesi admin terverifikasi. Tanpa Supabase, kembalikan null dan
// pemanggil menampilkan halaman "belum dikonfigurasi".

export class AdminError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ListOrdersFilter {
  status?: OrderStatus;
  dari?: string; // YYYY-MM-DD zona Asia/Jakarta
  sampai?: string;
  q?: string;
  page: number;
  limit: number;
}

export interface ListOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

function jakartaDateToUtcStart(date: string): Date {
  return new Date(`${date}T00:00:00+07:00`);
}

// Konversi `created_at` ISO ke tanggal kalender Jakarta (YYYY-MM-DD) untuk
// pengelompokan harian. en-CA menghasilkan format YYYY-MM-DD secara stabil.
function toJakartaDateString(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// Karakter khusus bisa memecah sintaks .or() PostgREST — buang saja.
function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()%]/g, " ").trim();
}

async function fetchItemRows(
  supabase: SupabaseClient,
  orderIds: readonly string[],
): Promise<Map<string, OrderItemRow[]>> {
  const grouped = new Map<string, OrderItemRow[]>();
  if (orderIds.length === 0) {
    return grouped;
  }

  const result = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", [...orderIds]);

  if (result.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal membaca item pesanan.");
  }

  for (const row of (result.data ?? []) as OrderItemRow[]) {
    const key = row.order_id as string;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  return grouped;
}

export async function listOrders(
  filter: ListOrdersFilter,
): Promise<ListOrdersResult | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const limit = Math.min(Math.max(filter.limit, 1), 100);
  const page = Math.max(filter.page, 1);

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (filter.dari) {
    query = query.gte(
      "created_at",
      jakartaDateToUtcStart(filter.dari).toISOString(),
    );
  }
  if (filter.sampai) {
    const endExclusive = new Date(
      jakartaDateToUtcStart(filter.sampai).getTime() + 86_400_000,
    );
    query = query.lt("created_at", endExclusive.toISOString());
  }

  const search = filter.q ? sanitizeSearchTerm(filter.q) : "";
  if (search.length >= 2) {
    query = query.or(
      `code.ilike.%${search}%,customer_name.ilike.%${search}%`,
    );
  }

  const result = await query;
  if (result.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal memuat daftar pesanan.");
  }

  const rows = (result.data ?? []) as OrderRow[];
  const itemsByOrder = await fetchItemRows(
    supabase,
    rows.map((row) => row.id as string),
  );

  return {
    orders: rows.map((row) =>
      rowToOrder(row, itemsByOrder.get(row.id as string) ?? []),
    ),
    total: result.count ?? 0,
    page,
    limit,
  };
}

export interface TodayStats {
  totalHariIni: number;
  menungguKonfirmasi: number;
  sedangDiproses: number;
  omzetHariIni: number;
}

// Kartu ringkasan atas halaman daftar pesanan (docs/14 §14.2).
// "Sedang diproses" = DIKONFIRMASI + DIPROSES; omzet hanya pesanan SELESAI
// (docs/14 §14.5).
export async function getTodayStats(): Promise<TodayStats | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const dayStart = getJakartaDayStartUtc(new Date()).toISOString();
  const dayEnd = new Date(
    getJakartaDayStartUtc(new Date()).getTime() + 86_400_000,
  ).toISOString();

  const result = await supabase
    .from("orders")
    .select("status, total")
    .gte("created_at", dayStart)
    .lt("created_at", dayEnd);

  if (result.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal memuat statistik harian.");
  }

  const rows = (result.data ?? []) as Array<{
    status: OrderStatus;
    total: number;
  }>;

  const stats: TodayStats = {
    totalHariIni: rows.length,
    menungguKonfirmasi: 0,
    sedangDiproses: 0,
    omzetHariIni: 0,
  };

  for (const row of rows) {
    if (row.status === "BARU") {
      stats.menungguKonfirmasi += 1;
    }
    if (row.status === "DIKONFIRMASI" || row.status === "DIPROSES") {
      stats.sedangDiproses += 1;
    }
    if (row.status === "SELESAI") {
      stats.omzetHariIni += row.total;
    }
  }

  return stats;
}

export async function getAdminOrder(
  code: string,
): Promise<Order | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const found = await findOrderRowsByCode(supabase, code);
  return found ? rowToOrder(found.row, found.itemRows) : null;
}

export interface UpdateOrderPatch {
  status?: OrderStatus;
  adminNote?: string;
  deliveryFee?: number;
  deliveryProvider?: DeliveryProvider;
  courierCost?: number;
}

// Compare-and-swap pada updated_at mencegah dua tab admin saling menimpa.
// Guard status tambahan membuat transisi state machine eksplisit di query.
export async function persistOrderUpdate(
  supabase: SupabaseClient,
  code: string,
  current: Pick<OrderRow, "status" | "updated_at">,
  update: Record<string, unknown>,
  guardsStatus: boolean,
): Promise<OrderRow> {
  if (!current.updated_at) {
    throw new AdminError(500, "INTERNAL_ERROR", "Versi pesanan tidak tersedia.");
  }

  let updateQuery = supabase
    .from("orders")
    .update(update)
    .eq("code", code)
    .eq("updated_at", current.updated_at);
  if (guardsStatus) {
    updateQuery = updateQuery.eq("status", current.status);
  }
  const updated = await updateQuery.select("*").maybeSingle();

  if (updated.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal menyimpan perubahan.");
  }
  if (!updated.data) {
    throw new AdminError(
      409,
      "ORDER_CONFLICT",
      "Pesanan sudah diubah admin lain. Muat ulang sebelum mencoba lagi.",
    );
  }
  return updated.data as OrderRow;
}

// Ubah status/catatan admin/ongkir. Transisi divalidasi ulang terhadap
// state machine (docs/11 §11.5, docs/04 §4.3) dan total dihitung ulang
// server saat ongkir diisi.
export async function updateOrder(
  code: string,
  patch: UpdateOrderPatch,
): Promise<Order | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const current = await findOrderRowsByCode(supabase, code);
  if (!current) {
    return null;
  }

  const update: Record<string, unknown> = {};

  const effectiveDeliveryFee =
    patch.deliveryFee !== undefined
      ? patch.deliveryFee
      : current.row.delivery_fee;
  const effectiveDeliveryProvider =
    patch.deliveryProvider !== undefined
      ? patch.deliveryProvider
      : current.row.delivery_provider;
  const effectiveCourierCost =
    patch.courierCost !== undefined
      ? patch.courierCost
      : current.row.courier_cost;
  const deliveryPlanChanged =
    patch.deliveryFee !== undefined ||
    patch.deliveryProvider !== undefined ||
    patch.courierCost !== undefined;
  const deliveryPlanReady = isDeliveryPlanReady({
    orderType: current.row.order_type,
    deliveryFee: effectiveDeliveryFee,
    deliveryProvider: effectiveDeliveryProvider,
    courierCost: effectiveCourierCost,
  });

  if (patch.status !== undefined) {
    if (!canTransition(current.row.status, patch.status)) {
      throw new AdminError(
        400,
        "INVALID_STATUS_TRANSITION",
        `Pesanan tidak bisa berubah dari ${current.row.status} ke ${patch.status}.`,
      );
    }
    if (
      statusRequiresFinalTotal(patch.status) &&
      !deliveryPlanReady
    ) {
      throw new AdminError(
        409,
        "DELIVERY_PLAN_PENDING",
        "Tetapkan pengantar, ongkir pelanggan, dan biaya kurir sebelum mengonfirmasi pesanan Antar.",
      );
    }
    update.status = patch.status;
  }

  if (patch.adminNote !== undefined) {
    update.admin_note = patch.adminNote.trim() || null;
  }

  if (deliveryPlanChanged) {
    if (current.row.order_type !== "antar") {
      throw new AdminError(
        409,
        "PICKUP_FEE_FIXED",
        "Pesanan Ambil Sendiri tidak memiliki pengantar atau ongkir.",
      );
    }
    if (!canEditDeliveryFee({
      orderType: current.row.order_type,
      status: current.row.status,
      paymentClaimedAt: current.row.payment_claimed_at,
      paymentProofUrl: current.row.payment_proof_url,
    })) {
      throw new AdminError(
        409,
        "ORDER_FINANCIALS_LOCKED",
        "Pengantar dan ongkir tidak dapat diubah setelah pembayaran diklaim, bukti dikirim, atau status dikonfirmasi.",
      );
    }
    if (!deliveryPlanReady) {
      throw new AdminError(
        400,
        "DELIVERY_PLAN_INCOMPLETE",
        "Pengantar, ongkir pelanggan, dan biaya kurir wajib diisi bersama.",
      );
    }
    if (!isCashDeliveryProviderAllowed({
      orderType: current.row.order_type,
      paymentMethod: current.row.payment_method,
      deliveryProvider: effectiveDeliveryProvider,
    })) {
      throw new AdminError(
        409,
        "COD_REQUIRES_INTERNAL_DELIVERY",
        "Pesanan Tunai/COD hanya boleh diantar langsung oleh MAU'S Kitchen.",
      );
    }
    update.delivery_fee = effectiveDeliveryFee;
    update.delivery_provider = effectiveDeliveryProvider;
    update.courier_cost = effectiveCourierCost;
    update.total = calculateOrderTotal(current.row.subtotal, effectiveDeliveryFee);
  }

  if (Object.keys(update).length === 0) {
    throw new AdminError(400, "VALIDATION_ERROR", "Tidak ada perubahan.");
  }

  await persistOrderUpdate(
    supabase,
    code,
    current.row,
    update,
    patch.status !== undefined,
  );

  const after = await findOrderRowsByCode(supabase, code);
  return after ? rowToOrder(after.row, after.itemRows) : null;
}

// Tandai URL/path bukti pembayaran pada pesanan.
export async function attachPaymentProof(
  code: string,
  path: string,
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) {
    throw new AdminError(503, "FITUR_BELUM_AKTIF", "Supabase belum dikonfigurasi.");
  }

  const updated = await supabase
    .from("orders")
    .update({ payment_proof_url: path })
    .eq("code", code)
    .eq("status", "BARU")
    .is("payment_proof_url", null)
    .or(
      "order_type.eq.ambil,and(delivery_fee.not.is.null,delivery_provider.not.is.null,courier_cost.not.is.null)",
    )
    .select("id")
    .maybeSingle();

  if (updated.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal menyimpan bukti bayar.");
  }
  if (!updated.data) {
    throw new AdminError(
      409,
      "PROOF_NOT_ALLOWED",
      "Bukti pembayaran sudah dikirim atau status pesanan telah berubah.",
    );
  }
}

// Bucket payment-proofs bersifat private — admin melihat lewat signed URL.
export async function getProofSignedUrl(
  path: string,
): Promise<string | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}

export interface RekapData {
  dari: string;
  sampai: string;
  totalPesanan: number;
  pesananSelesai: number;
  pesananBatal: number;
  omzet: number;
  rataRataTransaksi: number;
  itemTerlaris: Array<{ itemId: string; name: string; qty: number }>;
  perMetodeBayar: Record<PaymentMethod, number>;
  orders: Order[];
}

// Rekap penjualan periode (docs/14 §14.5). Agregasi di JS karena volume
// UMKM kecil; omzet hanya dari pesanan SELESAI.
export async function getRekapData(
  dari: string,
  sampai: string,
): Promise<RekapData | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const start = jakartaDateToUtcStart(dari).toISOString();
  const endExclusive = new Date(
    jakartaDateToUtcStart(sampai).getTime() + 86_400_000,
  ).toISOString();

  const orderResult = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", start)
    .lt("created_at", endExclusive);

  if (orderResult.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal memuat rekap.");
  }

  const orderRows = (orderResult.data ?? []) as OrderRow[];

  const itemResult = await fetchItemRows(
    supabase,
    orderRows.map((row) => row.id as string),
  );

  const rekap: RekapData = {
    dari,
    sampai,
    totalPesanan: orderRows.length,
    pesananSelesai: 0,
    pesananBatal: 0,
    omzet: 0,
    rataRataTransaksi: 0,
    itemTerlaris: [],
    perMetodeBayar: { qris: 0, transfer: 0, tunai: 0 },
    orders: [],
  };

  const qtyByItem = new Map<string, { name: string; qty: number }>();

  for (const row of orderRows) {
    const itemRows = itemResult.get(row.id as string) ?? [];
    rekap.orders.push(rowToOrder(row, itemRows));

    if (row.status === "SELESAI") {
      rekap.pesananSelesai += 1;
      rekap.omzet += row.total;
    }
    if (row.status === "BATAL") {
      rekap.pesananBatal += 1;
    }
    rekap.perMetodeBayar[row.payment_method] += 1;

    for (const itemRow of itemRows) {
      const entry = qtyByItem.get(itemRow.item_id);
      if (entry) {
        entry.qty += itemRow.quantity;
      } else {
        qtyByItem.set(itemRow.item_id, {
          name: itemRow.item_name,
          qty: itemRow.quantity,
        });
      }
    }
  }

  rekap.rataRataTransaksi =
    rekap.pesananSelesai > 0
      ? Math.round(rekap.omzet / rekap.pesananSelesai)
      : 0;

  rekap.itemTerlaris = [...qtyByItem.entries()]
    .map(([itemId, value]) => ({ itemId, name: value.name, qty: value.qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return rekap;
}

export interface DailySeriesPoint {
  date: string; // YYYY-MM-DD zona Asia/Jakarta
  pesanan: number; // jumlah seluruh pesanan hari itu
  omzet: number; // sum total pesanan berstatus SELESAI hari itu
}

export interface DailySeriesRow {
  created_at: string;
  total: number;
  status: OrderStatus;
}

// Agregasi murni deret harian: kelompokkan baris orders per tanggal Jakarta
// dan isi tanggal kosong dengan 0 agar kurva tidak ada celah. Dipisah dari
// Supabase agar dapat diuji unit tanpa mock (selaras pola test di src/lib).
export function aggregateDailySeries(
  rows: readonly DailySeriesRow[],
  dari: string,
  sampai: string,
): DailySeriesPoint[] {
  const points = new Map<string, DailySeriesPoint>();

  // Seed seluruh tanggal dari `dari` s.d. `sampai` (inklusif) dengan 0. Pakai
  // Date UTC tengah malam supaya toISOString().slice(0,10) stabil tanpa
  // pergeseran zona waktu.
  const startUtc = Date.UTC(
    Number(dari.slice(0, 4)),
    Number(dari.slice(5, 7)) - 1,
    Number(dari.slice(8, 10)),
  );
  const endUtc = Date.UTC(
    Number(sampai.slice(0, 4)),
    Number(sampai.slice(5, 7)) - 1,
    Number(sampai.slice(8, 10)),
  );
  for (let ms = startUtc; ms <= endUtc; ms += 86_400_000) {
    const key = new Date(ms).toISOString().slice(0, 10);
    points.set(key, { date: key, pesanan: 0, omzet: 0 });
  }

  for (const row of rows) {
    const point = points.get(toJakartaDateString(row.created_at));
    if (!point) {
      // Baris di luar rentang — seharusnya tidak terjadi karena query sudah
      // membatasi, tapi tetap ditangani defensif.
      continue;
    }
    point.pesanan += 1;
    if (row.status === "SELESAI") {
      point.omzet += row.total;
    }
  }

  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Deret harian untuk kurva area dashboard (docs/14 §14.0). Query minimalkan
// field ke created_at/total/status; zona Asia/Jakarta; omzet hanya SELESAI
// (konsisten dengan getRekapData).
export async function getDailySeries(
  dari: string,
  sampai: string,
): Promise<DailySeriesPoint[] | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }

  const start = jakartaDateToUtcStart(dari).toISOString();
  const endExclusive = new Date(
    jakartaDateToUtcStart(sampai).getTime() + 86_400_000,
  ).toISOString();

  const result = await supabase
    .from("orders")
    .select("created_at, total, status")
    .gte("created_at", start)
    .lt("created_at", endExclusive);

  if (result.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal memuat deret harian.");
  }

  const rows = (result.data ?? []) as DailySeriesRow[];
  return aggregateDailySeries(rows, dari, sampai);
}
