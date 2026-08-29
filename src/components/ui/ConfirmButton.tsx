"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// Konfirmasi destruktif dua langkah (pola inline yang sudah dipakai admin
// OrderDetailActions — bukan window.confirm yang memblokir). Klik pertama
// memasang mode "armed": muncul tombol konfirmasi + Batal; tanpa auto-timeout
// agar tidak buru-buru bagi pengguna keyboard/SR.
export interface ConfirmButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  onConfirm: () => void;
  // Konten tombol pemicu (mis. ikon tempat sampah / teks "Kosongkan").
  label: ReactNode;
  // Konten tombol konfirmasi langkah kedua (mis. "Ya, Hapus").
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
}

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  cancelLabel = "Batal",
  className,
  ...props
}: ConfirmButtonProps) {
  const [isArmed, setArmed] = useState(false);

  if (!isArmed) {
    return (
      <button
        type="button"
        onClick={() => {
          setArmed(true);
        }}
        className={className}
        {...props}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
        className={cn(
          "flex min-h-11 items-center gap-1.5 rounded-full bg-chili px-4 text-sm font-bold text-white transition-colors hover:bg-chili/90",
        )}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => {
          setArmed(false);
        }}
        className="flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm font-semibold text-brown transition-colors hover:bg-gold/15"
      >
        {cancelLabel}
      </button>
    </span>
  );
}
