"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { Spinner } from "@/components/common/Spinner";
import { Toast } from "@/components/common/Toast";
import { Input, Label, Textarea } from "@/components/ui";
import { getDefaultPaymentMethod } from "@/config/payment";
import { useCart, useRehydrateCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import {
  CHECKOUT_IDEMPOTENCY_STORAGE_KEY,
  getCheckoutIdempotencyKey,
} from "@/lib/order-idempotency";
import {
  useOrderHistory,
  useRehydrateOrderHistory,
} from "@/lib/order-history-store";
import { phoneSchema } from "@/lib/validations";
import type { OrderStatus, PaymentMethod } from "@/types/order";

// Skema form checkout: field UI (mode jadwal) dipisah dari skema API;
// payload dikonversi ke createOrderSchema saat submit.
const checkoutFormSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60),
    whatsapp: phoneSchema,
    orderType: z.enum(["antar", "ambil"]),
    address: z.string().trim().max(300).optional(),
    addressNote: z.string().trim().max(150).optional(),
    scheduleMode: z.enum(["secepatnya", "jadwalkan"]),
    scheduledAt: z.string().trim().optional(),
    note: z.string().trim().max(200).optional(),
    paymentMethod: z.enum(["qris", "transfer", "tunai"]),
    privacyConsent: z.boolean().refine((value) => value, {
      message: "Centang persetujuan privasi untuk melanjutkan",
    }),
  })
  .superRefine((values, ctx) => {
    if (values.orderType === "antar" && (values.address?.length ?? 0) < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Alamat wajib diisi untuk pesanan antar (min. 10 karakter)",
      });
    }
    if (values.scheduleMode === "jadwalkan" && !values.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledAt"],
        message: "Isi waktu pengambilan/pengantaran",
      });
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

const DRAFT_STORAGE_KEY = "mauskitchen-checkout-draft";

interface CheckoutFormProps {
  subtotal: number;
  onOrderCreated: () => void;
}

interface OrderSuccessResponse {
  success: true;
  data: {
    code: string;
    token: string;
    trackingUrl: string;
    createdAt: string;
    total: number;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    paymentUrl: string;
  };
}

interface OrderFailureResponse {
  success: false;
  error: string;
  message: string;
  fields?: Record<string, string>;
}

export function CheckoutForm({
  subtotal,
  onOrderCreated,
}: CheckoutFormProps) {
  useRehydrateCart();
  useRehydrateOrderHistory();
  const router = useRouter();
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clear);
  const addOrder = useOrderHistory((state) => state.addOrder);

  const [isSubmitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastIdRef = useRef(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      orderType: "antar",
      address: "",
      addressNote: "",
      scheduleMode: "secepatnya",
      scheduledAt: "",
      note: "",
      paymentMethod: getDefaultPaymentMethod(),
      privacyConsent: false,
    },
  });

  // React Hook Form mengelola subscription internal; komponen ini sengaja
  // tidak dimemoisasi oleh React Compiler.
  // eslint-disable-next-line react-hooks/incompatible-library
  const orderType = watch("orderType");
  const scheduleMode = watch("scheduleMode");

  // Draft form bertahan selama sesi tab (docs/08_UI_UX_SPEC.md §8.5).
  const watched = watch();
  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(watched),
      );
    } catch {
      // sessionStorage penuh/di-blok: draft opsional, abaikan.
    }
  }, [watched]);

  useEffect(() => {
    try {
      const draft = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        reset(JSON.parse(draft));
      }
    } catch {
      // Draft rusak: mulai dari nilai kosong.
    }
  }, [reset]);

  function showToast(message: string): void {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message });
  }

  async function submitOrder(values: CheckoutFormValues): Promise<void> {
    setSubmitting(true);
    try {
      const requestBody = JSON.stringify({
        customer: {
          name: values.name,
          whatsapp: values.whatsapp,
          orderType: values.orderType,
          address: values.address || undefined,
          addressNote: values.addressNote || undefined,
          scheduledAt:
            values.scheduleMode === "jadwalkan" && values.scheduledAt
              ? new Date(values.scheduledAt).toISOString()
              : null,
          note: values.note || undefined,
        },
        items: items.map((item) => ({
          itemId: item.itemId,
          variantId: item.variantId,
          addOnIds: item.addOns.map((addOn) => addOn.id),
          quantity: item.quantity,
          note: item.note ?? null,
        })),
        paymentMethod: values.paymentMethod,
        privacyConsent: values.privacyConsent,
      });
      const idempotencyKey = await getCheckoutIdempotencyKey(
        requestBody,
        window.sessionStorage,
        window.crypto,
      );
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: requestBody,
      });

      const json = (await response.json()) as
        | OrderSuccessResponse
        | OrderFailureResponse;

      if (!response.ok || !json.success) {
        if (json.success === false && json.fields) {
          for (const [field, message] of Object.entries(json.fields)) {
            setError(field as keyof CheckoutFormValues, { message });
          }
        }
        showToast(
          json.success === false
            ? json.message
            : "Gagal membuat pesanan. Coba lagi ya.",
        );
        return;
      }

      addOrder({
        code: json.data.code,
        token: json.data.token,
        status: json.data.status,
        paymentMethod: json.data.paymentMethod,
        total: json.data.total,
        createdAt: json.data.createdAt,
      });
      onOrderCreated();
      clearCart();
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
      router.push(json.data.paymentUrl);
    } catch (error) {
      console.error("[checkout]", error);
      showToast("Gagal membuat pesanan. Coba lagi sebentar lagi ya.");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(values: CheckoutFormValues): void {
    void submitOrder(values);
  }

  const submitLabel = useMemo(
    () =>
      isSubmitting
        ? "Memproses pesanan…"
        : `Buat Pesanan — ${formatRupiah(subtotal)}`,
    [isSubmitting, subtotal],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <fieldset className="space-y-4 rounded-2xl border border-gold/20 bg-cream-soft p-5">
        <legend className="px-1 text-sm font-bold text-brown-deep">
          Data Pemesan
        </legend>

        <div>
          <Label htmlFor="name" required>
            Nama Lengkap
          </Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="mt-2"
          />
          {errors.name ? (
            <p id="name-error" role="alert" className="mt-1.5 text-sm font-semibold text-chili">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="whatsapp" required>
            Nomor WhatsApp
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx / 628xx / +628xx"
            {...register("whatsapp")}
            invalid={Boolean(errors.whatsapp)}
            aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
            className="mt-2"
          />
          {errors.whatsapp ? (
            <p id="whatsapp-error" role="alert" className="mt-1.5 text-sm font-semibold text-chili">
              {errors.whatsapp.message}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold text-brown-deep">
            Tipe Pesanan <span className="text-chili">*</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { value: "antar", label: "Antar" },
                { value: "ambil", label: "Ambil Sendiri" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-gold/25 bg-cream px-4 py-2 text-sm font-semibold text-brown-deep transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/15"
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register("orderType")}
                  className="size-4 accent-gold"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {orderType === "antar" ? (
          <div>
            <Label htmlFor="address" required>
              Alamat Lengkap
            </Label>
            <Textarea
              id="address"
              rows={2}
              {...register("address")}
              invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              className="mt-2 resize-none"
            />
            {errors.address ? (
              <p id="address-error" role="alert" className="mt-1.5 text-sm font-semibold text-chili">
                {errors.address.message}
              </p>
            ) : null}
            <Label htmlFor="addressNote" optional="opsional" className="mt-3">
              Patokan / Catatan Alamat
            </Label>
            <Input
              id="addressNote"
              type="text"
              {...register("addressNote")}
              className="mt-2"
            />
          </div>
        ) : null}

        <div>
          <p className="text-sm font-semibold text-brown-deep">
            Waktu Pesanan <span className="text-chili">*</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { value: "secepatnya", label: "Secepatnya" },
                { value: "jadwalkan", label: "Jadwalkan" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-gold/25 bg-cream px-4 py-2 text-sm font-semibold text-brown-deep transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/15"
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register("scheduleMode")}
                  className="size-4 accent-gold"
                />
                {option.label}
              </label>
            ))}
          </div>
          {scheduleMode === "jadwalkan" ? (
            <div className="mt-3">
              <Label htmlFor="scheduledAt" required>
                Waktu Pengambilan / Pengantaran
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...register("scheduledAt")}
                invalid={Boolean(errors.scheduledAt)}
                aria-describedby={errors.scheduledAt ? "scheduledAt-error" : undefined}
                className="mt-2"
              />
              {errors.scheduledAt ? (
                <p id="scheduledAt-error" role="alert" className="mt-1.5 text-sm font-semibold text-chili">
                  {errors.scheduledAt.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <Label htmlFor="note" optional="opsional">
            Catatan Pesanan
          </Label>
          <Textarea
            id="note"
            rows={2}
            maxLength={200}
            {...register("note")}
            className="mt-2 resize-none"
          />
        </div>
      </fieldset>

      <PaymentMethodPicker
        value={watch("paymentMethod")}
        orderType={orderType}
        onChange={(value) => {
          setValue("paymentMethod", value);
        }}
      />

      {/* Persetujuan privasi SEBELUM CTA agar syarat wajib terlihat sebelum
          tombol kirim (terutama saat CTA menempel di bawah pada seluler). */}
      <label className="flex items-start gap-3 rounded-xl border border-gold/20 bg-cream-soft px-4 py-3 text-xs leading-5 text-brown/75">
        <input
          type="checkbox"
          {...register("privacyConsent")}
          className="mt-0.5 size-4 shrink-0 accent-gold"
        />
        <span>
          Saya setuju data pesanan dipakai untuk memproses pesanan dan saya
          dihubungi lewat WhatsApp. Baca{" "}
          <Link
            href="/privasi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            kebijakan privasi
          </Link>
          .
        </span>
      </label>
      {errors.privacyConsent ? (
        <p role="alert" className="text-sm font-semibold text-chili">
          {errors.privacyConsent.message}
        </p>
      ) : null}

      {/* Sticky CTA mobile: menempel di atas MobileBottomBar (~56px+safe-area).
          z-sticky (50) di atas FAB (z-fab 40) sesuai tangga z-index — bar
          berlatar solid menutup FAB saat tumpang tindih (docs/08 §8.1, A4).
          Desktop kembali inline statis. */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+3.5rem)] z-sticky -mx-4 border-t border-gold/20 bg-cream/95 px-4 py-3 backdrop-blur-xl lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {isSubmitting ? <Spinner className="size-4" /> : null}
          {submitLabel}
        </button>
      </div>

      {toast !== null && (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={() => {
            setToast(null);
          }}
        />
      )}
    </form>
  );
}
