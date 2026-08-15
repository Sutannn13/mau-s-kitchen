import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findOrderRowsByCode,
  getJakartaDayStartUtc,
  rowToOrder,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/order-db";
import { canTransition } from "@/lib/order-status";
import { getServiceClient } from "@/lib/supabase/admin";
import type { Order, OrderStatus, PaymentMethod } from "@/types/order";

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
  const supabase = getServiceClient();
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
  const supabase = getServiceClient();
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
  const supabase = getServiceClient();
  if (!supabase) {
    return null;
  }

  const found = await findOrderRowsByCode(supabase, code);
  return found ? rowToOrder(found.row, found.itemRows) : null;
}

export interface UpdateOrderPatch {
  status?: OrderStatus;
  adminNote?: string;
  deliveryFee?: number | null;
}

// Ubah status/catatan admin/ongkir. Transisi divalidasi ulang terhadap
// state machine (docs/11 §11.5, docs/04 §4.3) dan total dihitung ulang
// server saat ongkir diisi.
export async function updateOrder(
  code: string,
  patch: UpdateOrderPatch,
): Promise<Order | null> {
  const supabase = getServiceClient();
  if (!supabase) {
    return null;
  }

  const current = await findOrderRowsByCode(supabase, code);
  if (!current) {
    return null;
  }

  const update: Record<string, unknown> = {};

  if (patch.status !== undefined) {
    if (!canTransition(current.row.status, patch.status)) {
      throw new AdminError(
        400,
        "INVALID_STATUS_TRANSITION",
        `Pesanan tidak bisa berubah dari ${current.row.status} ke ${patch.status}.`,
      );
    }
    update.status = patch.status;
  }

  if (patch.adminNote !== undefined) {
    update.admin_note = patch.adminNote.trim() || null;
  }

  if (patch.deliveryFee !== undefined) {
    if (patch.deliveryFee !== null && (patch.deliveryFee < 0 || !Number.isInteger(patch.deliveryFee))) {
      throw new AdminError(400, "VALIDATION_ERROR", "Ongkir tidak valid.");
    }
    update.delivery_fee = patch.deliveryFee;
    update.total = current.row.subtotal + (patch.deliveryFee ?? 0);
  }

  if (Object.keys(update).length === 0) {
    throw new AdminError(400, "VALIDATION_ERROR", "Tidak ada perubahan.");
  }

  const updated = await supabase
    .from("orders")
    .update(update)
    .eq("code", code)
    .select("*")
    .maybeSingle();

  if (updated.error || !updated.data) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal menyimpan perubahan.");
  }

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
    .eq("code", code);

  if (updated.error) {
    throw new AdminError(500, "INTERNAL_ERROR", "Gagal menyimpan bukti bayar.");
  }
}

// Bucket payment-proofs bersifat private — admin melihat lewat signed URL.
export async function getProofSignedUrl(
  path: string,
): Promise<string | null> {
  const supabase = getServiceClient();
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
  const supabase = getServiceClient();
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
