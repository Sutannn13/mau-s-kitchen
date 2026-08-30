"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

// Auto-dismiss 2,5 detik sesuai keputusan desain Sprint 2 (pengganti
// sementara sebelum store keranjang T3.1). Lihat docs/08_UI_UX_SPEC.md §8.3.
const AUTO_DISMISS_MS = 2500;
// Fase keluar: slide down + fade 150ms sebelum benar-benar unmount —
// dikelola sendiri di komponen agar pemakai tidak perlu AnimatePresence.
const EXIT_MS = 150;

export function Toast({ message, onDismiss }: ToastProps) {
  const [leaving, setLeaving] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => {
      setLeaving(true);
    }, AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(enterTimer);
    };
  }, []);

  useEffect(() => {
    if (!leaving) {
      return;
    }
    const exitTimer = window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        onDismiss();
      }
    }, EXIT_MS);
    return () => {
      window.clearTimeout(exitTimer);
    };
  }, [leaving, onDismiss]);

  // bottom-24 agar tidak menutupi WhatsAppFab yang menempel di kanan bawah.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-toast flex justify-center px-4 md:bottom-28">
      <p
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-full bg-brown-deep/95 px-5 py-3 text-sm font-semibold text-cream shadow-warm-lg transition-[opacity,transform] duration-150",
          leaving && "translate-y-2 opacity-0",
        )}
      >
        <Check aria-hidden="true" className="size-4 text-gold" strokeWidth={2.5} />
        {message}
      </p>
    </div>
  );
}
