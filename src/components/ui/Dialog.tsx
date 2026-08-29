"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDialogA11y } from "./useDialogA11y";

// Shell modal/sheet bersama — a11y (role=dialog/trap/Esc/focus-restore/
// scroll-lock) satu sumber kebenaran di useDialogA11y. ProductSheet memakai
// hook tersebut langsung karena punya struktur swipe & posisi khusus; Dialog
// ini dipakai admin MenuItemEditor (Batch 5) dan modal terpusat lainnya.
export interface DialogProps {
  onClose: () => void;
  // Judul terlihat & jadi sumber aria-labelledby (otomatis id stabil).
  title: ReactNode;
  // Isi panel di bawah header.
  children: ReactNode;
  closeLabel?: string;
  panelClassName?: string;
}

export function Dialog({
  onClose,
  title,
  children,
  closeLabel = "Tutup",
  panelClassName,
}: DialogProps) {
  const titleId = useId();
  const { dialogRef, handleKeyDown } = useDialogA11y({ onClose });

  return (
    <div className="fixed inset-0 z-dialog flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-fade-in motion-reduce:animate-none absolute inset-0 bg-ink/60"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "animate-sheet-up motion-reduce:animate-none",
          "relative w-full max-w-lg rounded-t-3xl border-t border-gold/30 bg-cream-soft shadow-warm-lg outline-none",
          "sm:rounded-3xl sm:border",
          panelClassName,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-5">
          <h2
            id={titleId}
            className="min-w-0 text-xl font-bold leading-tight text-brown-deep"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-brown transition-colors hover:bg-gold/15"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
