"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { Toast } from "@/components/common/Toast";
import { useCart, useRehydrateCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import { phoneSchema } from "@/lib/validations";

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
    whatsappUrl: string;
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
  const router = useRouter();
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clear);

  const [isSubmitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState<string | null>(
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
      paymentMethod: "qris",
    },
  });

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

  async function submitOrder(
    values: CheckoutFormValues,
    waTab: Window | null,
  ): Promise<void> {
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
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
        waTab?.close();
        return;
      }

      // Arahkan tab yang dibuka lebih dulu (pola anti popup-blocker
      // docs/13_WHATSAPP_INTEGRATION.md §13.4).
      if (waTab) {
        waTab.location.href = json.data.whatsappUrl;
      } else {
        setWhatsappFallbackUrl(json.data.whatsappUrl);
      }
      onOrderCreated();
      clearCart();
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      router.push(json.data.paymentUrl);
    } catch (error) {
      console.error("[checkout]", error);
      showToast("Gagal membuat pesanan. Coba lagi sebentar lagi ya.");
      waTab?.close();
    } finally {
      setSubmitting(false);
    }
  }

  // Tab kosong dibuka di event klik asli (bukan setelah await validasi)
  // agar tidak diblokir popup blocker. Bila validasi gagal, tab ditutup
  // kembali. Lihat docs/13 §13.4.
  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const waTab = window.open("", "_blank");
    void handleSubmit(
      (values) => submitOrder(values, waTab),
      () => {
        waTab?.close();
      },
    )(event);
  }

  const submitLabel = useMemo(
    () =>
      isSubmitting
        ? "Memproses pesanan…"
        : `Buat Pesanan — ${formatRupiah(subtotal)}`,
    [isSubmitting, subtotal],
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {whatsappFallbackUrl !== null && (
        <div
          role="alert"
          className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-brown-deep"
        >
          <p className="font-semibold">Pesanan berhasil dibuat.</p>
          <p className="mt-1">
            Tab WhatsApp gagal terbuka otomatis. Buka pesannya lewat tombol ini:
          </p>
          <a
            href={whatsappFallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brown-deep px-5 text-xs font-bold text-cream"
          >
            Buka Pesan WhatsApp
          </a>
        </div>
      )}

      <fieldset className="space-y-4 rounded-2xl border border-gold/20 bg-cream-soft p-5">
        <legend className="px-1 text-sm font-bold text-brown-deep">
          Data Pemesan
        </legend>

        <div>
          <label htmlFor="name" className="text-sm font-semibold text-brown-deep">
            Nama Lengkap <span className="text-chili">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="mt-2 min-h-11 w-full rounded-xl border border-gold/25 bg-cream px-4 text-sm text-brown-deep focus:border-gold"
          />
          {errors.name ? (
            <p id="name-error" role="alert" className="mt-1.5 text-sm font-semibold text-chili">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="whatsapp" className="text-sm font-semibold text-brown-deep">
            Nomor WhatsApp <span className="text-chili">*</span>
          </label>
          <input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx / 628xx / +628xx"
            {...register("whatsapp")}
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
            className="mt-2 min-h-11 w-full rounded-xl border border-gold/25 bg-cream px-4 text-sm text-brown-deep focus:border-gold"
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
            <label htmlFor="address" className="text-sm font-semibold text-brown-deep">
              Alamat Lengkap <span className="text-chili">*</span>
            </label>
            <textarea
              id="address"
              rows={2}
              {...register("address")}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              className="mt-2 w-full resize-none rounded-xl border border-gold/25 bg-cream px-4 py-3 text-sm text-brown-deep focus:border-gold"
            />
            {errors.address ? (
              <p id="address-error" role="alert" className="mt-1.5 text-sm font-semibold text-chili">
                {errors.address.message}
              </p>
            ) : null}
            <label htmlFor="addressNote" className="mt-3 block text-sm font-semibold text-brown-deep">
              Patokan / Catatan Alamat
            </label>
            <input
              id="addressNote"
              type="text"
              {...register("addressNote")}
              className="mt-2 min-h-11 w-full rounded-xl border border-gold/25 bg-cream px-4 text-sm text-brown-deep focus:border-gold"
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
              <label htmlFor="scheduledAt" className="text-sm font-semibold text-brown-deep">
                Waktu Pengambilan / Pengantaran
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                {...register("scheduledAt")}
                aria-invalid={Boolean(errors.scheduledAt)}
                aria-describedby={errors.scheduledAt ? "scheduledAt-error" : undefined}
                className="mt-2 min-h-11 w-full rounded-xl border border-gold/25 bg-cream px-4 text-sm text-brown-deep focus:border-gold"
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
          <label htmlFor="note" className="text-sm font-semibold text-brown-deep">
            Catatan Pesanan <span className="font-normal text-brown/60">(opsional)</span>
          </label>
          <textarea
            id="note"
            rows={2}
            maxLength={200}
            {...register("note")}
            className="mt-2 w-full resize-none rounded-xl border border-gold/25 bg-cream px-4 py-3 text-sm text-brown-deep focus:border-gold"
          />
        </div>
      </fieldset>

      <PaymentMethodPicker
        value={watch("paymentMethod")}
        onChange={(value) => {
          setValue("paymentMethod", value);
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting || items.length === 0}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-bold text-brown-deep shadow-warm transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {submitLabel}
      </button>

      <p className="text-center text-xs leading-5 text-brown/60">
        Dengan membuat pesanan, kamu setuju dikontak admin lewat WhatsApp.
        Lihat juga{" "}
        <Link href="/keranjang" className="font-semibold underline underline-offset-2">
          keranjangmu
        </Link>
        .
      </p>

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
