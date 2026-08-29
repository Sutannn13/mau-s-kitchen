"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";

// template.tsx dirender ulang oleh App Router pada setiap navigasi, jadi
// transisi halaman cukup satu animasi entrance di sini (docs/08 §8.3):
// fade 150ms opacity-only — halus, murah, dan tidak menggeser layout.
//
// Render hasil SSR (load pertama tiap request, termasuk hard reload)
// sengaja TANPA fade: memulai dari opacity 0 menunda first paint dan
// menekan skor LCP. Penanda "sudah pernah navigasi" disimpan di
// sessionStorage — dan WAJIB dibaca lewat useSyncExternalStore dengan
// server snapshot `false`: sessionStorage bertahan lintas reload, jadi
// membacanya langsung saat render membuat HTML server (opacity 1) tidak
// cocok dengan client (opacity 0) → hydration mismatch. Dengan snapshot
// server yang selalu false, render hydration selalu sinkron; nilai client
// baru dipakai pada mount template berikutnya (navigasi client-side).
const NAV_FLAG = "mk-has-navigated";

function subscribeNoop(): () => void {
  return () => {};
}

function getHasNavigatedSnapshot(): boolean {
  return window.sessionStorage.getItem(NAV_FLAG) === "1";
}

function getServerSnapshot(): boolean {
  return false;
}

export default function Template({ children }: { children: ReactNode }) {
  const shouldFade = useSyncExternalStore(
    subscribeNoop,
    getHasNavigatedSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    window.sessionStorage.setItem(NAV_FLAG, "1");
  }, []);

  return (
    <motion.div
      initial={shouldFade ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
