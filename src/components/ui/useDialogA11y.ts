"use client";

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";

// Selektor elemen yang dapat menerima fokus di dalam dialog (dipakai focus trap).
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseDialogA11yArgs {
  // Dipanggil saat Escape ditekan. Selalu diberi agar tombol x/tap-overlay
  // memakai jalur yang sama dengan keyboard — satu sumber kebenaran tutup.
  onClose: () => void;
}

export interface UseDialogA11yResult {
  // Tempel ke elemen dialog: <div ref={dialogRef} role="dialog" tabIndex={-1} ...>
  dialogRef: RefObject<HTMLDivElement | null>;
  // Tempel ke onKeyDown dialog.
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

// A11y bersama untuk dialog/sheet/modal: focus-trap, Escape, focus restore,
// body scroll lock — diekstrak dari ProductSheet (docs/08 §8.8) tanpa mengubah
// perilaku. Dipakai ProductSheet + MenuItemEditor (Batch 5). Lihat plan §6
// "Dependency between steps".
export function useDialogA11y({ onClose }: UseDialogA11yArgs): UseDialogA11yResult {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Fokus awal + kunci scroll body; pulihkan fokus & scroll saat dialog tutup.
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    // Focus trap: Tab berputar di dalam dialog. (docs/08_UI_UX_SPEC.md §8.8)
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTOR,
    );
    if (!focusables || focusables.length === 0) {
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) {
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }

  return { dialogRef, handleKeyDown };
}
