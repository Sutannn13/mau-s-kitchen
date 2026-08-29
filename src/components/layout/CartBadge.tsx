"use client";

import { motion } from "motion/react";

import { useCart, useRehydrateCart } from "@/lib/cart-store";

// Badge jumlah item keranjang, sinkron real-time dengan store (T3.6).
// Muncul setelah rehydrate agar tidak bentrok dengan HTML server.
// Angka "meletup" (spring 1.35 → 1) setiap kali jumlah berubah —
// konfirmasi visual bahwa item masuk keranjang; otomatis nonaktif untuk
// prefers-reduced-motion lewat MotionConfig di ChromeShell.
export function CartBadge() {
  useRehydrateCart();
  const totalQuantity = useCart((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  if (totalQuantity < 1) {
    return null;
  }

  return (
    <motion.span
      key={totalQuantity}
      initial={{ scale: 1.35 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 550, damping: 18 }}
      className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-chili px-1 py-0.5 text-[10px] font-bold leading-none text-white"
    >
      {totalQuantity > 99 ? "99+" : totalQuantity}
      <span className="sr-only"> item di keranjang</span>
    </motion.span>
  );
}
