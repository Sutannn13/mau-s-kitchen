"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// Pembungkus fade-in untuk blok dashboard. Children boleh server components
// (diteruskan sebagai props — legal di App Router). Pemanggil men-set
// key={periode} agar blok remount + fade setiap ganti periode; chart
// recharts ikut memutar ulang animasi bawaannya.
export function AnimatedSection({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
