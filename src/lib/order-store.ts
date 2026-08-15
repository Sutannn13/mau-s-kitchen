import { buildOrderCode } from "@/lib/order-code";
import {
  findOrderRowsByCode,
  generateDbOrderCode,
  insertOrder,
  rowToOrder,
} from "@/lib/order-db";
import { getServiceClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/order";

// Seam penyimpanan pesanan. Bila Supabase terkonfigurasi + service role key
// tersedia, pesanan disimpan ke database (Fase 2 / T6.2). Selain itu jatuh
// ke penyimpanan in-memory per proses (Fase 1) agar situs tetap berfungsi
// sebelum setup manual selesai. Lihat docs/10_DATA_MODEL.md §10.6.

interface MemoryOrderStore {
  orders: Map<string, Order>;
  usedCodes: Set<string>;
}

const globalScope = globalThis as unknown as {
  __mausKitchenOrderStore?: MemoryOrderStore;
};

const memoryStore: MemoryOrderStore = (globalScope.__mausKitchenOrderStore ??= {
  orders: new Map<string, Order>(),
  usedCodes: new Set<string>(),
});

export async function saveOrder(order: Order): Promise<void> {
  const supabase = getServiceClient();
  if (supabase) {
    await insertOrder(supabase, order);
    return;
  }
  memoryStore.orders.set(order.code, order);
  memoryStore.usedCodes.add(order.code);
}

export async function getOrderByCode(code: string): Promise<Order | undefined> {
  const supabase = getServiceClient();
  if (supabase) {
    const found = await findOrderRowsByCode(supabase, code);
    return found ? rowToOrder(found.row, found.itemRows) : undefined;
  }
  return memoryStore.orders.get(code);
}

// Urutan harian: count database + 1 saat DB aktif (docs/10 §10.6);
// mode in-memory memakai nomor acak 1–999 dengan cek tabrakan per proses.
export async function generateOrderCode(now: Date): Promise<string> {
  const supabase = getServiceClient();
  if (supabase) {
    return generateDbOrderCode(supabase, now);
  }

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const code = buildOrderCode(now, 1 + Math.floor(Math.random() * 999));
    if (!memoryStore.usedCodes.has(code)) {
      return code;
    }
  }
  throw new Error("Kode pesanan harian habis; coba lagi beberapa saat.");
}
