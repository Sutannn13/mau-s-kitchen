import type { SupabaseClient } from "@supabase/supabase-js";

import { getMenuItemById } from "@/lib/menu";
import { buildOrderCode } from "@/lib/order-code";
import type { MenuAddOn } from "@/types/menu";
import type { CartItem, Order } from "@/types/order";

// Baris tabel orders/order_items (docs/10_DATA_MODEL.md §10.3).
export interface OrderRow {
  id?: string;
  code: string;
  created_at?: string;
  updated_at?: string;
  customer_name: string;
  customer_wa: string;
  order_type: "antar" | "ambil";
  address: string | null;
  address_note: string | null;
  scheduled_at: string | null;
  customer_note: string | null;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  payment_method: "qris" | "transfer" | "tunai";
  payment_proof_url: string | null;
  status: Order["status"];
  admin_note: string | null;
}

export interface OrderItemRow {
  id?: string;
  order_id?: string;
  item_id: string;
  item_name: string;
  variant_id: string | null;
  variant_name: string | null;
  unit_price: number;
  add_ons: Array<{ id: string; name: string; price: number }>;
  note: string | null;
  quantity: number;
  subtotal: number;
}

function orderToRow(order: Order): OrderRow {
  return {
    code: order.code,
    customer_name: order.customer.name,
    customer_wa: order.customer.whatsapp,
    order_type: order.customer.orderType,
    address: order.customer.address ?? null,
    address_note: order.customer.addressNote ?? null,
    scheduled_at: order.customer.scheduledAt ?? null,
    customer_note: order.customer.note ?? null,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
    payment_method: order.paymentMethod,
    payment_proof_url: order.paymentProofUrl ?? null,
    status: order.status,
    admin_note: order.adminNote ?? null,
  };
}

function itemsToRows(orderId: string, items: readonly CartItem[]): OrderItemRow[] {
  return items.map((item) => ({
    order_id: orderId,
    item_id: item.itemId,
    item_name: item.name,
    variant_id: item.variantId,
    variant_name: item.variantName,
    unit_price: item.unitPrice,
    add_ons: item.addOns,
    note: item.note ?? null,
    quantity: item.quantity,
    subtotal:
      (item.unitPrice + item.addOns.reduce((sum, addOn) => sum + addOn.price, 0)) *
      item.quantity,
  }));
}

function rowToCartItem(row: OrderItemRow): CartItem {
  const addOns: MenuAddOn[] = Array.isArray(row.add_ons)
    ? row.add_ons.filter(
        (addOn): addOn is MenuAddOn =>
          typeof addOn?.id === "string" &&
          typeof addOn?.name === "string" &&
          typeof addOn?.price === "number",
      )
    : [];

  return {
    lineId: `${row.item_id}|${row.variant_id ?? "-"}|${addOns
      .map((addOn) => addOn.id)
      .sort()
      .join(",")}|${row.note ?? ""}`,
    itemId: row.item_id,
    name: row.item_name,
    image: "",
    variantId: row.variant_id,
    variantName: row.variant_name,
    unitPrice: row.unit_price,
    addOns,
    note: row.note ?? undefined,
    quantity: row.quantity,
  };
}

// image tidak disimpan di DB; katalog selalu digabung ulang dari menu.json.
function imageForItemId(itemId: string): string {
  return getMenuItemById(itemId)?.image ?? "";
}

export function rowToOrder(row: OrderRow, itemRows: readonly OrderItemRow[]): Order {
  const items = itemRows.map((itemRow) => ({
    ...rowToCartItem(itemRow),
    image: imageForItemId(itemRow.item_id),
  }));

  return {
    code: row.code,
    createdAt: row.created_at ?? new Date().toISOString(),
    customer: {
      name: row.customer_name,
      whatsapp: row.customer_wa,
      orderType: row.order_type,
      address: row.address ?? undefined,
      addressNote: row.address_note ?? undefined,
      scheduledAt: row.scheduled_at ?? undefined,
      note: row.customer_note ?? undefined,
    },
    items,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    paymentMethod: row.payment_method,
    ...(row.payment_proof_url
      ? { paymentProofUrl: row.payment_proof_url }
      : {}),
    status: row.status,
    ...(row.admin_note ? { adminNote: row.admin_note } : {}),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

// Insert pesanan + itemnya. supabase-js tidak mendukung transaksi, jadi
// kegagaln insert item dikompensasi dengan menghapus header pesanan.
export async function insertOrder(
  supabase: SupabaseClient,
  order: Order,
): Promise<void> {
  const inserted = await supabase
    .from("orders")
    .insert(orderToRow(order))
    .select("id")
    .single();

  if (inserted.error || !inserted.data) {
    throw new Error(
      `Gagal menyimpan pesanan: ${inserted.error?.message ?? "unknown"}`,
    );
  }

  const orderId = inserted.data.id as string;
  const savedItems = await supabase
    .from("order_items")
    .insert(itemsToRows(orderId, order.items));

  if (savedItems.error) {
    await supabase.from("orders").delete().eq("id", orderId);
    throw new Error(`Gagal menyimpan item pesanan: ${savedItems.error.message}`);
  }
}

export async function findOrderRowsByCode(
  supabase: SupabaseClient,
  code: string,
): Promise<{ row: OrderRow; itemRows: OrderItemRow[] } | null> {
  const orderResult = await supabase
    .from("orders")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  const row = orderResult.data as OrderRow | null;
  if (!row) {
    return null;
  }

  const itemResult = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", row.id as string);

  if (itemResult.error) {
    throw new Error(
      `Gagal membaca item pesanan: ${itemResult.error.message}`,
    );
  }

  return {
    row,
    itemRows: (itemResult.data ?? []) as OrderItemRow[],
  };
}

// WIB selalu UTC+7 tanpa DST — offset konstan aman dihitung manual.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getJakartaDayStartUtc(now: Date): Date {
  return new Date(
    Math.floor((now.getTime() + JAKARTA_OFFSET_MS) / 86_400_000) * 86_400_000 -
      JAKARTA_OFFSET_MS,
  );
}

// Urutan harian = count hari berjalan + 1 (docs/10_DATA_MODEL.md §10.6),
// dengan cek tabrakan kode karena bisa ada request bersamaan.
export async function generateDbOrderCode(
  supabase: SupabaseClient,
  now: Date,
): Promise<string> {
  const dayStart = getJakartaDayStartUtc(now);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const countResult = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStart.toISOString())
    .lt("created_at", dayEnd.toISOString());

  const baseCount = countResult.count ?? 0;

  for (let offset = 0; offset < 50; offset += 1) {
    const code = buildOrderCode(now, baseCount + 1 + offset);
    const exists = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("code", code);

    if ((exists.count ?? 0) === 0) {
      return code;
    }
  }

  throw new Error("Kode pesanan harian habis; coba lagi beberapa saat.");
}
