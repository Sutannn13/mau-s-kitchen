"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Toast } from "@/components/common/Toast";
import {
  compareOrderSnapshot,
  useOrderHistory,
  useOrderHistoryHydrated,
  useRehydrateOrderHistory,
  type OrderSnapshot,
} from "@/lib/order-history-store";
import { isOrderStatus, statusLabels } from "@/lib/order-status";
import type { DeliveryProvider, OrderStatus } from "@/types/order";

const POLL_INTERVAL_MS = 10_000;
const FINAL_STATUSES: readonly OrderStatus[] = ["SELESAI", "BATAL"];
const MAX_CONSECUTIVE_FAILURES = 3;

interface PublicOrderData {
  status: string;
  deliveryFee: number | null;
  deliveryProvider: DeliveryProvider | null;
  total: number;
}

interface PublicOrderResponse {
  success: true;
  data: PublicOrderData;
}

interface OrderErrorResponse {
  success: false;
  error: string;
  message: string;
}

interface OrderLiveTrackerProps {
  code: string;
  token: string;
  initialStatus: OrderStatus;
  initialDeliveryFee: number | null;
  initialDeliveryProvider: DeliveryProvider | null;
  initialTotal: number;
  /** Bila diisi, saat status berubah dari status awal, navigasikan otomatis ke URL ini (misal /pesanan/[kode]). */
  redirectToOnStatusChange?: string;
}

// Client island di halaman /pesanan/[kode]: polling GET /api/orders/[kode]?token
// tiap 10s (hanya saat tab terlihat). Saat status/total berubah → toast +
// router.refresh() agar RSC (timeline/total) ikut diperbarui. Berhenti polling
// bila status final. Pola soft-fail & visibility-check meniru AutoRefresh.
export function OrderLiveTracker({
  code,
  token,
  initialStatus,
  initialDeliveryFee,
  initialDeliveryProvider,
  initialTotal,
  redirectToOnStatusChange,
}: OrderLiveTrackerProps) {
  useRehydrateOrderHistory();
  const historyHydrated = useOrderHistoryHydrated();
  const router = useRouter();
  const updateSnapshot = useOrderHistory((state) => state.updateSnapshot);

  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const [degraded, setDegraded] = useState(false);
  const [unreachable, setUnreachable] = useState(false);

  const lastRef = useRef<OrderSnapshot>({
    status: initialStatus,
    total: initialTotal,
  });
  const lastDeliveryFeeRef = useRef<number | null>(initialDeliveryFee);
  const lastDeliveryProviderRef = useRef<DeliveryProvider | null>(
    initialDeliveryProvider,
  );
  const busyRef = useRef(false);
  const failedRef = useRef(0);
  const toastIdRef = useRef(0);

  function showToast(message: string): void {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message });
  }

  useEffect(() => {
    if (!historyHydrated) {
      return;
    }

    const initialSnapshot = { status: initialStatus, total: initialTotal };
    lastRef.current = initialSnapshot;
    lastDeliveryFeeRef.current = initialDeliveryFee;
    lastDeliveryProviderRef.current = initialDeliveryProvider;
    updateSnapshot(code, initialSnapshot);

    if (FINAL_STATUSES.includes(initialStatus)) {
      return;
    }

    const controller = new AbortController();
    const intervalIdRef = { current: 0 as number | undefined };

    async function tick(): Promise<void> {
      if (
        controller.signal.aborted ||
        document.visibilityState !== "visible" ||
        busyRef.current
      ) {
        return;
      }
      busyRef.current = true;
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`,
          { signal: controller.signal, cache: "no-store" },
        );

        if (response.status === 404) {
          window.clearInterval(intervalIdRef.current);
          setUnreachable(true);
          return;
        }

        if (!response.ok || response.status === 429) {
          failedRef.current += 1;
          if (failedRef.current >= MAX_CONSECUTIVE_FAILURES) {
            setDegraded(true);
          }
          return;
        }

        const json = (await response.json()) as
          | PublicOrderResponse
          | OrderErrorResponse;
        if (!json.success) {
          failedRef.current += 1;
          if (failedRef.current >= MAX_CONSECUTIVE_FAILURES) {
            setDegraded(true);
          }
          return;
        }

        if (!isOrderStatus(json.data.status)) {
          failedRef.current += 1;
          if (failedRef.current >= MAX_CONSECUTIVE_FAILURES) {
            setDegraded(true);
          }
          return;
        }

        failedRef.current = 0;
        setDegraded(false);

        const next: OrderSnapshot = {
          status: json.data.status,
          total: json.data.total,
        };
        const diff = compareOrderSnapshot(lastRef.current, next);
        const deliveryFeeChanged =
          json.data.deliveryFee !== lastDeliveryFeeRef.current;
        const deliveryProviderChanged =
          json.data.deliveryProvider !== lastDeliveryProviderRef.current;
        updateSnapshot(code, next);
        if (diff.statusChanged) {
          showToast(`Status berubah menjadi ${statusLabels[next.status]}`);
          if (redirectToOnStatusChange) {
            window.clearInterval(intervalIdRef.current);
            router.push(redirectToOnStatusChange);
            return;
          }
          router.refresh();
        } else if (
          diff.totalChanged ||
          deliveryFeeChanged ||
          deliveryProviderChanged
        ) {
          showToast("Pengantaran dan total diperbarui admin");
          router.refresh();
        }
        lastRef.current = next;
        lastDeliveryFeeRef.current = json.data.deliveryFee;
        lastDeliveryProviderRef.current = json.data.deliveryProvider;

        if (FINAL_STATUSES.includes(next.status)) {
          window.clearInterval(intervalIdRef.current);
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        failedRef.current += 1;
        if (failedRef.current >= MAX_CONSECUTIVE_FAILURES) {
          setDegraded(true);
        }
      } finally {
        busyRef.current = false;
      }
    }

    intervalIdRef.current = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      if (intervalIdRef.current !== undefined) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, [
    code,
    historyHydrated,
    initialStatus,
    initialDeliveryFee,
    initialDeliveryProvider,
    initialTotal,
    redirectToOnStatusChange,
    router,
    token,
    updateSnapshot,
  ]);

  return (
    <>
      {unreachable ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-chili/30 bg-chili/10 px-4 py-3 text-sm font-semibold text-chili"
        >
          Pesanan tidak dapat dilacak lagi.
        </p>
      ) : null}
      {degraded && !unreachable ? (
        <p
          role="alert"
          className="mt-4 text-xs font-semibold leading-5 text-chili"
        >
          Pembaruan otomatis bermasalah — muat ulang bila data terasa basi.
        </p>
      ) : null}
      {toast !== null ? (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={() => {
            setToast(null);
          }}
        />
      ) : null}
    </>
  );
}
