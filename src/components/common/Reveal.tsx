"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// Ungkap saat masuk viewport (sekali). Cermin AnimatedSection (admin) namun
// memakai whileInView agar blok di bawah lipat terungkap saat digulir, bukan
// saat mount. Children boleh server components (App Router). MotionConfig
// global (reducedMotion="user") meredam transform otomatis bila diminta.
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
