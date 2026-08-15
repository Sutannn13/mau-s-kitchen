"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { statusLabels } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";

// Aksi cepat dari kartu pesanan: maju satu status sesuai state machine
// tanpa membuka detail (docs/14 §14.2 baris 4).
export function QuickActionButton({
  code,
  target,
}: {
  code: string;
  target: OrderStatus;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
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
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={isBusy}
        className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-brown-deep transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {isBusy ? "Menyimpan…" : statusLabels[target]}
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
      {error ? (
        <span role="alert" className="text-xs text-chili">
          {error}
        </span>
      ) : null}
    </span>
  );
}
