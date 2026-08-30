"use client";

import { motion, useScroll, useSpring } from "motion/react";

// Garis tipis emas di atas halaman, isi mengikuti persentase scroll.
// Fixed top, z-sticky (di bawah header). Murni opacity/transform, GPU.
// Tidak tampil di rute admin (ChromeShell skip).
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-sticky h-[3px] origin-left bg-gradient-to-r from-gold via-gold-light to-gold"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
