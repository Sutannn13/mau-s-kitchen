"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// MotionConfig global untuk seluruh panel admin: animasi otomatis
// dinonaktifkan bila pengguna menyetel prefers-reduced-motion: reduce
// (aksesibilitas, docs/08_UI_UX_SPEC.md).
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
