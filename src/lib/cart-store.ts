import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { toCartItem } from "@/lib/cart-line";
import type { MenuItem, ProductSelection } from "@/types/menu";
import type { CartItem } from "@/types/order";

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem, selection: ProductSelection) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
}

// Subtotal dihitung lewat lib/pricing di komponen (bukan method store) agar
// nilai turunan tidak pernah basi. Lihat docs/09_TECH_STACK.md §9.3.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, selection) =>
        set((state) => {
          const incoming = toCartItem(item, selection);
          const existing = state.items.find(
            (line) => line.lineId === incoming.lineId,
          );
          if (!existing) {
            return { items: [...state.items, incoming] };
          }
          return {
            items: state.items.map((line) =>
              line.lineId === incoming.lineId
                ? { ...line, quantity: line.quantity + incoming.quantity }
                : line,
            ),
          };
        }),
      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((line) => line.lineId !== lineId),
        })),
      // updateQuantity < 1 menghapus baris. Lihat .ai/CODING_STANDARDS.md §5.
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((line) => line.lineId !== lineId)
              : state.items.map((line) =>
                  line.lineId === lineId ? { ...line, quantity } : line,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "mauskitchen-cart",
      version: 1,
      // skipHydration mencegah mismatch SSR: render pertama mengikuti server,
      // lalu rehydrate dijalankan dari efek klien (hook di bawah).
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Panggil sekali di komponen klien yang membaca keranjang (badge, halaman
// keranjang, checkout) sebelum menampilkan data.
export function useRehydrateCart(): void {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
}

export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeStart = useCart.persist.onHydrate(onStoreChange);
      const unsubscribeFinish = useCart.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeStart();
        unsubscribeFinish();
      };
    },
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
