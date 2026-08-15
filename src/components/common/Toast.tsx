"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

// Auto-dismiss 2,5 detik sesuai keputusan desain Sprint 2 (pengganti sementara
// sebelum store keranjang T3.1). Lihat docs/08_UI_UX_SPEC.md §8.3.
const AUTO_DISMISS_MS = 2500;

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  // bottom-24 agar tidak menutupi WhatsAppFab yang menempel di kanan bawah.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-28">
      <p
        role="status"
        className="animate-toast-in motion-reduce:animate-none flex items-center gap-2 rounded-full bg-brown-deep/95 px-5 py-3 text-sm font-semibold text-cream shadow-warm-lg"
      >
        <Check aria-hidden="true" className="size-4 text-gold" strokeWidth={2.5} />
        {message}
      </p>
    </div>
  );
}
