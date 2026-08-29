import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { isValidRecoveryToken } from "@/lib/order-recovery";
import type { OrderStatus, PaymentMethod } from "@/types/order";

export interface OrderHistoryEntry {
  code: string;
  token: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
}

interface OrderHistoryState {
  orders: OrderHistoryEntry[];
  addOrder: (entry: OrderHistoryEntry) => void;
  updateSnapshot: (code: string, snapshot: OrderSnapshot) => void;
  removeOrder: (code: string) => void;
  pruneExpired: () => void;
  clear: () => void;
}

const MAX_ENTRIES = 10;
export const ORDER_HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;
const VALID_STATUSES = new Set<OrderStatus>([
  "BARU",
  "DIKONFIRMASI",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
  "BATAL",
]);
const VALID_PAYMENT_METHODS = new Set<PaymentMethod>([
  "qris",
  "transfer",
  "tunai",
]);

function isOrderHistoryEntry(value: unknown): value is OrderHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.code === "string" &&
    entry.code.length > 0 &&
    typeof entry.token === "string" &&
    isValidRecoveryToken(entry.token) &&
    typeof entry.status === "string" &&
    VALID_STATUSES.has(entry.status as OrderStatus) &&
    typeof entry.paymentMethod === "string" &&
    VALID_PAYMENT_METHODS.has(entry.paymentMethod as PaymentMethod) &&
    typeof entry.total === "number" &&
    Number.isInteger(entry.total) &&
    entry.total >= 0 &&
    typeof entry.createdAt === "string" &&
    Number.isFinite(Date.parse(entry.createdAt))
  );
}

// Token tetap diperlukan untuk guest access; field URL turunan dibuang dan
// entri dibatasi 30 hari. Naikkan batas hanya bila kebijakan retensi berubah.
export function normalizeOrderHistoryEntries(
  value: unknown,
  nowMs = Date.now(),
): OrderHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const oldestAllowed = nowMs - ORDER_HISTORY_RETENTION_MS;
  const seenCodes = new Set<string>();
  const normalized: OrderHistoryEntry[] = [];

  for (const candidate of value) {
    if (!isOrderHistoryEntry(candidate)) {
      continue;
    }
    const createdAtMs = Date.parse(candidate.createdAt);
    if (createdAtMs < oldestAllowed || createdAtMs > nowMs + 5 * 60 * 1_000) {
      continue;
    }
    const code = candidate.code.trim().toUpperCase();
    if (!code || seenCodes.has(code)) {
      continue;
    }
    seenCodes.add(code);
    normalized.push({
      code,
      token: candidate.token,
      status: candidate.status,
      paymentMethod: candidate.paymentMethod,
      total: candidate.total,
      createdAt: candidate.createdAt,
    });
    if (normalized.length === MAX_ENTRIES) {
      break;
    }
  }

  return normalized;
}

export const useOrderHistory = create<OrderHistoryState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (entry) =>
        set((state) => {
          const filtered = state.orders.filter((o) => o.code !== entry.code);
          return { orders: normalizeOrderHistoryEntries([entry, ...filtered]) };
        }),
      updateSnapshot: (code, snapshot) =>
        set((state) => {
          let changed = false;
          const orders = state.orders.map((order) => {
            if (
              order.code !== code ||
              (order.status === snapshot.status && order.total === snapshot.total)
            ) {
              return order;
            }
            changed = true;
            return { ...order, ...snapshot };
          });
          return changed ? { orders } : state;
        }),
      removeOrder: (code) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.code !== code),
        })),
      pruneExpired: () =>
        set((state) => ({
          orders: normalizeOrderHistoryEntries(state.orders),
        })),
      clear: () => set({ orders: [] }),
    }),
    {
      name: "mauskitchen-order-history",
      version: 2,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<OrderHistoryState> | undefined;
        return {
          ...state,
          orders: normalizeOrderHistoryEntries(state?.orders),
        } as OrderHistoryState;
      },
    },
  ),
);

export function useRehydrateOrderHistory(): void {
  useEffect(() => {
    void Promise.resolve(useOrderHistory.persist.rehydrate()).then(() => {
      useOrderHistory.getState().pruneExpired();
    });
  }, []);
}

export function useOrderHistoryHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeStart = useOrderHistory.persist.onHydrate(onStoreChange);
      const unsubscribeFinish = useOrderHistory.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeStart();
        unsubscribeFinish();
      };
    },
    () => useOrderHistory.persist.hasHydrated(),
    () => false,
  );
}

export interface OrderSnapshot {
  status: OrderStatus;
  total: number;
}

export interface OrderSnapshotDiff {
  statusChanged: boolean;
  totalChanged: boolean;
}

export function compareOrderSnapshot(
  prev: OrderSnapshot,
  next: OrderSnapshot,
): OrderSnapshotDiff {
  return {
    statusChanged: prev.status !== next.status,
    totalChanged: prev.total !== next.total,
  };
}
