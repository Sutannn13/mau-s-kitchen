import type { SupabaseClient } from "@supabase/supabase-js";

import { getMenuItemById } from "@/lib/menu";
import { isValidOrderCode } from "@/lib/order-code";
import type { MenuAddOn } from "@/types/menu";
import type { CartItem, DeliveryProvider, Order } from "@/types/order";

// Baris tabel orders/order_items (docs/10_DATA_MODEL.md §10.3).
export interface OrderRow {
  id?: string;
  code: string;
  public_token: string;
  idempotency_key?: string | null;
  request_fingerprint?: string | null;
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
  delivery_provider: DeliveryProvider | null;
  courier_cost: number | null;
  total: number;
  payment_method: "qris" | "transfer" | "tunai";
  payment_proof_url: string | null;
  payment_claimed_at?: string | null;
  status: Order["status"];
  admin_note: string | null;
}

export interface OrderIdempotency {
  key: string;
  fingerprint: string;
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

function orderToRow(
  order: Order,
  idempotency?: OrderIdempotency,
): OrderRow {
  return {
    code: order.code,
    public_token: order.publicToken,
    ...(idempotency
      ? {
          idempotency_key: idempotency.key,
          request_fingerprint: idempotency.fingerprint,
        }
      : {}),
    customer_name: order.customer.name,
    customer_wa: order.customer.whatsapp,
    order_type: order.customer.orderType,
    address: order.customer.address ?? null,
    address_note: order.customer.addressNote ?? null,
    scheduled_at: order.customer.scheduledAt ?? null,
    customer_note: order.customer.note ?? null,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    delivery_provider: order.deliveryProvider,
    courier_cost: order.courierCost,
    total: order.total,
    payment_method: order.paymentMethod,
    payment_proof_url: order.paymentProofUrl ?? null,
    payment_claimed_at: order.paymentClaimedAt ?? null,
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
    publicToken: row.public_token,
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
    deliveryProvider: row.delivery_provider ?? null,
    courierCost: row.courier_cost ?? null,
    total: row.total,
    paymentMethod: row.payment_method,
    ...(row.payment_proof_url
      ? { paymentProofUrl: row.payment_proof_url }
      : {}),
    ...(row.payment_claimed_at
      ? { paymentClaimedAt: row.payment_claimed_at }
      : {}),
    status: row.status,
    ...(row.admin_note ? { adminNote: row.admin_note } : {}),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

export class OrderIdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency key sudah dipakai.");
  }
}

export class OrderDatabaseError extends Error {
  readonly operation: string;
  readonly details: unknown;

  constructor(operation: string, details: unknown) {
    super(`Operasi database pesanan gagal: ${operation}.`);
    this.operation = operation;
    this.details = details;
  }
}

// RPC membungkus header + item dalam satu transaksi. Ini juga memastikan
// retry dengan idempotency key tidak pernah membaca pesanan setengah jadi.
export async function insertOrder(
  supabase: SupabaseClient,
  order: Order,
  idempotency?: OrderIdempotency,
): Promise<string> {
  const inserted = await supabase.rpc("insert_order_with_items_v2", {
    p_order: orderToRow(order, idempotency),
    p_items: itemsToRows("", order.items),
  });

  if (inserted.error || !isValidOrderCode(inserted.data)) {
    if (
      inserted.error?.code === "23505" &&
      inserted.error.message.includes("idempotency")
    ) {
      throw new OrderIdempotencyConflictError();
    }
    throw new OrderDatabaseError("menyimpan pesanan", inserted.error);
  }

  return inserted.data;
}

async function findItemRowsForOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderItemRow[]> {
  const itemResult = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemResult.error) {
    throw new OrderDatabaseError("membaca item pesanan", itemResult.error);
  }
  return (itemResult.data ?? []) as OrderItemRow[];
}

export async function findOrderRowsByPublicAccess(
  supabase: SupabaseClient,
  code: string,
  publicToken: string,
): Promise<{ row: OrderRow; itemRows: OrderItemRow[] } | null> {
  const orderResult = await supabase
    .from("orders")
    .select("*")
    .eq("code", code)
    .eq("public_token", publicToken)
    .maybeSingle();

  if (orderResult.error) {
    throw new OrderDatabaseError("membaca pesanan publik", orderResult.error);
  }
  const row = orderResult.data as OrderRow | null;
  if (!row) {
    return null;
  }

  return {
    row,
    itemRows: await findItemRowsForOrder(supabase, row.id as string),
  };
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

  if (orderResult.error) {
    throw new OrderDatabaseError("membaca pesanan admin", orderResult.error);
  }
  const row = orderResult.data as OrderRow | null;
  if (!row) {
    return null;
  }

  return {
    row,
    itemRows: await findItemRowsForOrder(supabase, row.id as string),
  };
}

export async function findOrderRowsByIdempotencyKey(
  supabase: SupabaseClient,
  key: string,
): Promise<{ row: OrderRow; itemRows: OrderItemRow[] } | null> {
  const orderResult = await supabase
    .from("orders")
    .select("*")
    .eq("idempotency_key", key)
    .maybeSingle();

  if (orderResult.error) {
    throw new OrderDatabaseError("membaca retry pesanan", orderResult.error);
  }
  const row = orderResult.data as OrderRow | null;
  if (!row) {
    return null;
  }
  return {
    row,
    itemRows: await findItemRowsForOrder(supabase, row.id as string),
  };
}

// WIB selalu UTC+7 tanpa DST; dipakai untuk batas rekap harian admin.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getJakartaDayStartUtc(now: Date): Date {
  return new Date(
    Math.floor((now.getTime() + JAKARTA_OFFSET_MS) / 86_400_000) * 86_400_000 -
      JAKARTA_OFFSET_MS,
  );
}
