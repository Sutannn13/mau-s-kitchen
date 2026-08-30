"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Ban, ChevronDown, Loader2 } from "lucide-react";

import { getAdminTargets, statusLabels } from "@/lib/order-status";
import {
  getStatusMenuPosition,
  type StatusMenuPosition,
} from "@/lib/admin/status-menu-position";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { requiresManualPaymentVerification } from "@/lib/order-payment";
import type { OrderStatus, PaymentMethod } from "@/types/order";

// Dropdown ubah status langsung dari kartu pesanan: admin bisa lompat
// ke status mana pun yang sah tanpa maju satu-satu atau buka detail
// (docs/14_ADMIN_DASHBOARD.md §14.2). Panel dibuat custom (bukan
// <select> native) supaya buka/tutupnya bisa dianimasi. Pilihan "Batal"
// memakai konfirmasi dua langkah DI DALAM menu (bukan window.confirm —
// dialog native bisa di-auto-accept webview, pesanan bisa terbatal
// tanpa sengaja). State lokal di-reset lewat `key` dari parent saat
// status pesanan berubah, jadi tidak perlu effect. Animasi otomatis
// nonaktif untuk prefers-reduced-motion lewat MotionConfig di layout
// admin.
export function StatusSelect({
  code,
  status,
  paymentMethod,
  total,
}: {
  code: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingBatal, setConfirmingBatal] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<StatusMenuPosition>({
    left: 12,
    top: 12,
    transformOrigin: "top right",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const targets = getAdminTargets(status);
  const isFinal = targets.length === 0;

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    setMenuPosition(
      getStatusMenuPosition(trigger.getBoundingClientRect(), {
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    updateMenuPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  async function handleChange(target: OrderStatus): Promise<void> {
    setIsOpen(false);
    if (target === status) {
      return;
    }
    if (requiresManualPaymentVerification(status, target, paymentMethod)) {
      setError(
        `Buka detail pesanan untuk memeriksa pembayaran ${formatRupiah(total)} sebelum mengubah status.`,
      );
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(body?.message ?? "Gagal memperbarui status.");
        return;
      }
      router.refresh();
    } catch {
      setError("Periksa koneksi lalu coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <div
        ref={containerRef}
        className="relative flex min-h-11 items-center gap-2"
      >
        <span className="text-xs font-semibold text-brown/60">
          Ubah status
        </span>
        <button
          ref={triggerRef}
          type="button"
          disabled={isBusy || isFinal}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Ubah status pesanan ${code} (sekarang ${statusLabels[status]})`}
          onClick={() => {
            if (!isOpen) {
              updateMenuPosition();
            }
            setIsOpen((open) => !open);
            setConfirmingBatal(false);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 bg-cream px-4 text-sm font-semibold text-brown-deep outline-none transition-colors hover:bg-gold/15 focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin"
              strokeWidth={2}
            />
          ) : null}
          {isBusy
            ? "Menyimpan…"
            : `${statusLabels[status]}${isFinal ? " (final)" : ""}`}
          <motion.span
            aria-hidden="true"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <ChevronDown className="size-4" strokeWidth={2} />
          </motion.span>
        </button>

        {typeof document !== "undefined"
          ? createPortal(
              <AnimatePresence>
                {isOpen && !isFinal ? (
                  <motion.div
              key={`status-menu-${code}`}
              ref={menuRef}
              role="menu"
              aria-label={`Pilihan status pesanan ${code}`}
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={menuPosition}
              className="fixed z-[100] max-h-[calc(100vh-1.5rem)] w-52 overflow-y-auto rounded-2xl border border-gold/30 bg-cream p-1.5 shadow-warm-lg"
            >
              {targets.map((target) => (
                <div key={target}>
                  {target === "BATAL" ? (
                    <div
                      aria-hidden="true"
                      className="my-1 border-t border-gold/20"
                    />
                  ) : null}
                  {target === "BATAL" && confirmingBatal ? (
                    <div
                      role="group"
                      aria-label={`Konfirmasi pembatalan pesanan ${code}`}
                      className="my-1 rounded-xl bg-chili/10 p-1.5"
                    >
                      <p className="px-2 pb-1 pt-0.5 text-xs font-semibold text-chili">
                        Batalkan pesanan {code}? Permanen.
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            void handleChange("BATAL");
                          }}
                          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-chili px-3 text-sm font-bold text-white outline-none transition-colors hover:bg-chili/90 focus-visible:ring-2 focus-visible:ring-chili/40 disabled:opacity-60"
                        >
                          <Ban
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={2}
                          />
                          Ya, batalkan
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setConfirmingBatal(false);
                          }}
                          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gold/40 bg-cream px-3 text-sm font-semibold text-brown outline-none transition-colors hover:bg-gold/15 focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-60"
                        >
                          Jangan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isBusy}
                      onClick={() => {
                        if (target === "BATAL") {
                          setConfirmingBatal(true);
                          return;
                        }
                        void handleChange(target);
                      }}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-60",
                        target === "BATAL"
                          ? "text-chili hover:bg-chili/10"
                          : "text-brown-deep hover:bg-gold/15",
                      )}
                    >
                      {target === "BATAL" ? (
                        <Ban
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={2}
                        />
                      ) : null}
                      {statusLabels[target]}
                    </button>
                  )}
                </div>
              ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>,
              document.body,
              `status-menu-${code}`,
            )
          : null}
      </div>
      {error ? (
        <span role="alert" className="text-xs text-chili">
          {error}
        </span>
      ) : null}
    </span>
  );
}
