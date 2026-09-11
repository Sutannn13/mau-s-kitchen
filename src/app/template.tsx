"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

// template.tsx dirender ulang oleh App Router pada setiap navigasi, jadi
// transisi halaman cukup satu animasi entrance di sini (docs/08 §8.3):
// fade + rise 200ms — halus, murah, dan nyaris tidak menggeser layout.
// Pasangan logis pill meluncur di MobileBottomBar (transisi antar tab).
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
//
// Rute /admin/* dan /invoice/* dilewati: admin punya (panel)/template.tsx
// sendiri (AnimatedSection) dan invoice adalah dokumen cetak mandiri.
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
  const pathname = usePathname() ?? "/";
  const allowFade =
    !pathname.startsWith("/admin") && !pathname.startsWith("/invoice");
  const hasNavigated = useSyncExternalStore(
    subscribeNoop,
    getHasNavigatedSnapshot,
    getServerSnapshot,
  );
  const shouldFade = allowFade && hasNavigated;

  useEffect(() => {
    window.sessionStorage.setItem(NAV_FLAG, "1");
  }, []);

  if (!shouldFade) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
