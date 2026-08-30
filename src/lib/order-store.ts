import { buildOrderCode } from "@/lib/order-code";
import {
  findOrderRowsByPublicAccess,
  findOrderRowsByCode,
  findOrderRowsByIdempotencyKey,
  insertOrder,
  OrderIdempotencyConflictError,
  rowToOrder,
  type OrderIdempotency,
} from "@/lib/order-db";
import { tokensMatch } from "@/lib/order-access";
import { isDeliveryPlanReady } from "@/lib/order-delivery";
import { getServiceClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/order";

// Seam penyimpanan pesanan. Bila Supabase terkonfigurasi + service role key
// tersedia, pesanan disimpan ke database (Fase 2 / T6.2). Selain itu jatuh
// ke penyimpanan in-memory per proses (Fase 1) agar situs tetap berfungsi
// sebelum setup manual selesai. Lihat docs/10_DATA_MODEL.md §10.6.

interface MemoryOrderStore {
  orders: Map<string, Order>;
  usedCodes: Set<string>;
  idempotency: Map<string, { fingerprint: string; orderCode: string }>;
}

const globalScope = globalThis as unknown as {
  __mausKitchenOrderStore?: MemoryOrderStore;
};

const memoryStore: MemoryOrderStore = (globalScope.__mausKitchenOrderStore ??= {
  orders: new Map<string, Order>(),
  usedCodes: new Set<string>(),
  idempotency: new Map<string, { fingerprint: string; orderCode: string }>(),
});

// Menjaga kompatibilitas hot-reload dengan object global versi sebelumnya.
memoryStore.idempotency ??= new Map();

export class OrderStoreUnavailableError extends Error {
  constructor() {
    super("Penyimpanan pesanan belum dikonfigurasi.");
  }
}

export class IdempotencyKeyReuseError extends Error {
  constructor() {
    super("Idempotency key dipakai untuk payload yang berbeda.");
  }
}

function unavailableAfterDatabaseError(operation: string, error: unknown): never {
  console.error("[order-store] database unavailable", { operation, error });
  throw new OrderStoreUnavailableError();
}

function allowMemoryStore(): boolean {
  return process.env.NODE_ENV !== "production";
}

// Hasil klaim "Saya Sudah Bayar" oleh pelanggan. Klaim tidak mengubah status
// pesanan — verifikasi tetap milik admin (docs/04_BUSINESS_FLOW.md §4.3).
export type PaymentClaimResult =
  | { outcome: "claimed"; claimedAt: string }
  | { outcome: "already-claimed"; claimedAt: string }
  | { outcome: "not-found" }
  | { outcome: "not-allowed"; message: string };

// Aturan kelayakan klaim dipisah agar dipakai jalur DB maupun in-memory
// dan bisa diuji tanpa Supabase.
export function evaluatePaymentClaim(order: Order): PaymentClaimResult | null {
  if (order.paymentMethod === "tunai") {
    return {
      outcome: "not-allowed",
      message: "Pesanan tunai dibayar saat pesanan tiba, tidak perlu klaim bayar.",
    };
  }
  if (order.status !== "BARU") {
    return {
      outcome: "not-allowed",
      message: "Status pesanan sudah berubah. Cek halaman status pesananmu ya.",
    };
  }
  if (!isDeliveryPlanReady({
    orderType: order.customer.orderType,
    deliveryFee: order.deliveryFee,
    deliveryProvider: order.deliveryProvider,
    courierCost: order.courierCost,
  })) {
    return {
      outcome: "not-allowed",
      message: "Ongkir belum ditetapkan admin. Tunggu total akhir sebelum membayar.",
    };
  }
  if (order.paymentClaimedAt) {
    return { outcome: "already-claimed", claimedAt: order.paymentClaimedAt };
  }
  return null;
}

export async function markPaymentClaimed(
  code: string,
  publicToken: string,
): Promise<PaymentClaimResult> {
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const found = await findOrderRowsByPublicAccess(supabase, code, publicToken);
      if (!found) {
        // Saat DB aktif, DB adalah sumber kebenaran: pesanan memang tidak ada.
        return { outcome: "not-found" };
      }
      {
        const blocked = evaluatePaymentClaim(rowToOrder(found.row, found.itemRows));
        if (blocked) {
          return blocked;
        }

        const claimedAt = new Date().toISOString();
        // Guard `is null` + `status BARU` membuat klaim aman terhadap
        // dua request bersamaan: yang kedua tidak mendapat baris.
        const updated = await supabase
          .from("orders")
          .update({ payment_claimed_at: claimedAt })
          .eq("code", code)
          .eq("public_token", publicToken)
          .eq("status", "BARU")
          .is("payment_claimed_at", null)
          .or(
            "order_type.eq.ambil,and(delivery_fee.not.is.null,delivery_provider.not.is.null,courier_cost.not.is.null)",
          )
          .select("payment_claimed_at")
          .maybeSingle();

        if (updated.error) {
          throw new Error(`Gagal menyimpan klaim bayar: ${updated.error.message}`);
        }
        if (!updated.data) {
          return {
            outcome: "not-allowed",
            message: "Klaim pembayaran sudah tercatat sebelumnya.",
          };
        }
        return { outcome: "claimed", claimedAt };
      }
    } catch (error) {
      // Saat Supabase sudah terhubung, jangan membuat state bayangan di RAM:
      // kegagalan DB harus terlihat agar pelanggan tidak menerima pesanan semu.
      unavailableAfterDatabaseError("mark-payment-claimed", error);
    }
  }

  if (!allowMemoryStore()) {
    throw new OrderStoreUnavailableError();
  }

  const order = memoryStore.orders.get(code);
  if (!order || !tokensMatch(order.publicToken, publicToken)) {
    return { outcome: "not-found" };
  }
  const blocked = evaluatePaymentClaim(order);
  if (blocked) {
    return blocked;
  }
  const claimedAt = new Date().toISOString();
  memoryStore.orders.set(code, {
    ...order,
    paymentClaimedAt: claimedAt,
    updatedAt: claimedAt,
  });
  return { outcome: "claimed", claimedAt };
}

export async function saveOrder(
  order: Order,
  idempotency?: OrderIdempotency,
): Promise<Order> {
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const code = await insertOrder(supabase, order, idempotency);
      return code === order.code ? order : { ...order, code };
    } catch (error) {
      if (error instanceof OrderIdempotencyConflictError && idempotency) {
        const existing = await findOrderRowsByIdempotencyKey(
          supabase,
          idempotency.key,
        );
        if (!existing) {
          unavailableAfterDatabaseError("resolve-idempotency-conflict", error);
        }
        if (existing.row.request_fingerprint !== idempotency.fingerprint) {
          throw new IdempotencyKeyReuseError();
        }
        return rowToOrder(existing.row, existing.itemRows);
      }
      unavailableAfterDatabaseError("save-order", error);
    }
  }
  if (!allowMemoryStore()) {
    throw new OrderStoreUnavailableError();
  }
  if (idempotency) {
    const previous = memoryStore.idempotency.get(idempotency.key);
    if (previous) {
      if (previous.fingerprint !== idempotency.fingerprint) {
        throw new IdempotencyKeyReuseError();
      }
      const existing = memoryStore.orders.get(previous.orderCode);
      if (existing) {
        return existing;
      }
    }
  }

  memoryStore.orders.set(order.code, order);
  memoryStore.usedCodes.add(order.code);
  if (idempotency) {
    memoryStore.idempotency.set(idempotency.key, {
      fingerprint: idempotency.fingerprint,
      orderCode: order.code,
    });
  }
  return order;
}

export async function getOrderByCode(code: string): Promise<Order | undefined> {
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const found = await findOrderRowsByCode(supabase, code);
      return found ? rowToOrder(found.row, found.itemRows) : undefined;
    } catch (error) {
      unavailableAfterDatabaseError("get-order-by-code", error);
    }
  }
  if (!allowMemoryStore()) {
    throw new OrderStoreUnavailableError();
  }
  return memoryStore.orders.get(code);
}

export async function getOrderByPublicAccess(
  code: string,
  publicToken: string,
): Promise<Order | undefined> {
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const found = await findOrderRowsByPublicAccess(supabase, code, publicToken);
      return found ? rowToOrder(found.row, found.itemRows) : undefined;
    } catch (error) {
      unavailableAfterDatabaseError("get-order-by-public-access", error);
    }
  }
  if (!allowMemoryStore()) {
    throw new OrderStoreUnavailableError();
  }
  const order = memoryStore.orders.get(code);
  return order && tokensMatch(order.publicToken, publicToken) ? order : undefined;
}

// Urutan harian: count database + 1 saat DB aktif (docs/10 §10.6);
// mode in-memory memakai nomor acak 1–999 dengan cek tabrakan per proses.
export async function generateOrderCode(now: Date): Promise<string> {
  const supabase = getServiceClient();
  if (supabase) {
    // DB mengganti placeholder ini dengan urutan atomik di transaksi insert.
    return buildOrderCode(now, 1);
  }

  if (!allowMemoryStore()) {
    throw new OrderStoreUnavailableError();
  }

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const code = buildOrderCode(now, 1 + Math.floor(Math.random() * 999));
    if (!memoryStore.usedCodes.has(code)) {
      return code;
    }
  }
  throw new Error("Kode pesanan harian habis; coba lagi beberapa saat.");
}
