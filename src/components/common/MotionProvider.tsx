"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// MotionConfig global untuk seluruh rute pelanggan: animasi otomatis
// dinonaktifkan bila pengguna menyetel prefers-reduced-motion: reduce
// (aksesibilitas, docs/08_UI_UX_SPEC.md §8.3 — upgrade A1). Cermin admin
// MotionProvider, dipasang sebagai client island di root layout agar layout
// tetap RSC.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
