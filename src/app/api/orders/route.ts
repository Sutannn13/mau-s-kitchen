import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { AdminError, listOrders } from "@/lib/admin/orders";
import {
  isPaymentMethodEnabled,
  requiresPrepayment,
} from "@/config/payment";
import {
  getFreshMenu,
  MenuStoreUnavailableError,
} from "@/lib/menu-data";
import { buildPublicOrderUrl, generateOrderAccessToken } from "@/lib/order-access";
import {
  generateOrderCode,
  IdempotencyKeyReuseError,
  OrderStoreUnavailableError,
  saveOrder,
} from "@/lib/order-store";
import { isValidIdempotencyKey } from "@/lib/order-idempotency";
import { isOrderStatus } from "@/lib/order-status";
import { cartSubtotal } from "@/lib/pricing";
import {
  calculateOrderTotal,
  getInitialDeliveryFee,
} from "@/lib/order-pricing";
import { isPrivacyConfigurationReady } from "@/lib/privacy";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import {
  readRequestBytesWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/request-body";
import { verifyAdminRequest } from "@/lib/supabase/auth";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { createOrderSchema } from "@/lib/validations";
import type { MenuItem, MenuVariant } from "@/types/menu";
import type { CartItem, Order } from "@/types/order";

const MAX_ORDER_BODY_BYTES = 64 * 1024;

interface CreateOrderRequestBody {
  customer?: unknown;
  items?: unknown;
  paymentMethod?: unknown;
}

function jsonError(
  status: number,
  error: string,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { success: false, error, message, ...extra },
    { status },
  );
}

function omitPublicToken(order: Order): Omit<Order, "publicToken"> {
  const { publicToken, ...safeOrder } = order;
  void publicToken;
  return safeOrder;
}

// POST /api/orders — harga SELALU dihitung ulang dari tabel menu_items,
// klien tidak mengirim nilai harga. Bila DB tidak dapat diakses saat checkout,
// tolak dengan 503 MENU_STORE_UNAVAILABLE (jangan pakai fallback JSON yang
// mungkin stale). Lihat docs/11_API_SPEC.md §11.2.
export async function POST(request: Request): Promise<NextResponse> {
  if (await isRateLimited(`order:${getClientIp(request.headers)}`)) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi ya.",
    );
  }

  if (!isPrivacyConfigurationReady()) {
    return jsonError(
      503,
      "PRIVACY_CONFIG_INCOMPLETE",
      "Pemesanan online belum aktif. Hubungi admin melalui WhatsApp ya.",
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return jsonError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "Permintaan checkout tidak valid. Muat ulang halaman lalu coba lagi.",
    );
  }

  const contentLength = Number.parseInt(
    request.headers.get("content-length") ?? "0",
    10,
  );
  if (Number.isFinite(contentLength) && contentLength > MAX_ORDER_BODY_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Data pesanan terlalu besar.");
  }

  let body: CreateOrderRequestBody;
  let rawBody: string;
  try {
    const rawBytes = await readRequestBytesWithLimit(
      request,
      MAX_ORDER_BODY_BYTES,
    );
    rawBody = new TextDecoder().decode(rawBytes);
    body = JSON.parse(rawBody) as CreateOrderRequestBody;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return jsonError(413, "PAYLOAD_TOO_LARGE", "Data pesanan terlalu besar.");
    }
    return jsonError(400, "VALIDATION_ERROR", "Format permintaan tidak valid.");
  }
  const requestFingerprint = createHash("sha256").update(rawBody).digest("hex");

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) {
        fields[key] = issue.message;
      }
    }
    return jsonError(400, "VALIDATION_ERROR", "Periksa kembali isian form.", {
      fields,
    });
  }

  const payload = parsed.data;

  if (!isPaymentMethodEnabled(payload.paymentMethod)) {
    return jsonError(
      409,
      "PAYMENT_UNAVAILABLE",
      "Metode pembayaran tersebut belum tersedia. Pilih metode lain.",
    );
  }

  // Harga & ketersediaan dari DB (no-store, fail-closed) agar perubahan admin
  // langsung berlaku saat checkout (docs/14 §14.4).
  let menuItems: MenuItem[];
  try {
    menuItems = (await getFreshMenu()).items;
  } catch (error) {
    if (error instanceof MenuStoreUnavailableError) {
      return jsonError(
        503,
        "MENU_STORE_UNAVAILABLE",
        "Menu sedang tidak dapat dimuat. Coba lagi sebentar ya.",
      );
    }
    throw error;
  }

  // Validasi item terhadap data menu; item tak dikenal → 400, item habis → 409
  // dengan daftar id (docs/11_API_SPEC.md §11.2).
  const unavailableIds: string[] = [];
  const cartItems: CartItem[] = [];
  let unknownItemId: string | null = null;

  for (const line of payload.items) {
    const menuItem = menuItems.find((item) => item.id === line.itemId);
    if (!menuItem) {
      unknownItemId = line.itemId;
      break;
    }
    if (!menuItem.available) {
      unavailableIds.push(menuItem.id);
      continue;
    }

    let variant: MenuVariant | null = null;
    if (menuItem.variants.length > 0) {
      const match = menuItem.variants.find((v) => v.id === line.variantId);
      if (!match) {
        return jsonError(
          400,
          "VALIDATION_ERROR",
          "Pilih ukuran terlebih dahulu.",
          {
            fields: {
              [`items.${line.itemId}.variantId`]:
                "Pilih ukuran terlebih dahulu.",
            },
          },
        );
      }
      variant = match;
    }

    const addOns: CartItem["addOns"] = [];
    for (const addOnId of line.addOnIds) {
      const match = menuItem.addOns.find((addOn) => addOn.id === addOnId);
      if (!match) {
        return jsonError(400, "VALIDATION_ERROR", "Tambahan tidak dikenal.", {
          fields: {
            [`items.${line.itemId}.addOnIds`]: "Tambahan tidak dikenal.",
          },
        });
      }
      addOns.push(match);
    }

    const note = line.note?.trim();
    cartItems.push({
      lineId: `${line.itemId}|${variant?.id ?? "-"}|${[...line.addOnIds].sort().join(",")}|${note ?? ""}`,
      itemId: menuItem.id,
      name: menuItem.name,
      image: menuItem.image,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      unitPrice: variant?.price ?? menuItem.basePrice,
      addOns,
      note: note || undefined,
      quantity: line.quantity,
    });
  }

  if (unknownItemId !== null) {
    return jsonError(400, "VALIDATION_ERROR", "Ada item yang tidak dikenal.", {
      fields: { items: "Ada item menu yang tidak dikenal." },
    });
  }

  if (unavailableIds.length > 0) {
    return jsonError(
      409,
      "ITEM_UNAVAILABLE",
      "Ada menu yang baru saja habis. Hapus item tersebut lalu coba lagi.",
      { items: unavailableIds },
    );
  }

  if (cartItems.length === 0) {
    return jsonError(422, "EMPTY_CART", "Keranjang masih kosong.");
  }

  const now = new Date();
  const subtotal = cartSubtotal(cartItems);
  const deliveryFee = getInitialDeliveryFee(payload.customer.orderType);
  let order: Order;
  try {
    const draft: Order = {
      code: await generateOrderCode(now),
      publicToken: generateOrderAccessToken(),
      createdAt: now.toISOString(),
      customer: {
        ...payload.customer,
        address: payload.customer.address || undefined,
        addressNote: payload.customer.addressNote || undefined,
        scheduledAt: payload.customer.scheduledAt || undefined,
        note: payload.customer.note || undefined,
      },
      items: cartItems,
      subtotal,
      deliveryFee,
      deliveryProvider: null,
      courierCost: null,
      total: calculateOrderTotal(subtotal, deliveryFee),
      paymentMethod: payload.paymentMethod,
      status: "BARU",
      updatedAt: now.toISOString(),
    };
    order = await saveOrder(draft, {
      key: idempotencyKey,
      fingerprint: requestFingerprint,
    });
  } catch (error) {
    if (error instanceof IdempotencyKeyReuseError) {
      return jsonError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "Data checkout berubah saat dikirim ulang. Silakan coba sekali lagi.",
      );
    }
    if (error instanceof OrderStoreUnavailableError) {
      return jsonError(
        503,
        "ORDER_STORE_UNAVAILABLE",
        "Pemesanan sedang tidak tersedia. Hubungi admin melalui WhatsApp ya.",
      );
    }
    console.error("[POST /api/orders]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan pesanan.");
  }

  const trackingUrl = buildPublicOrderUrl("pesanan", order.code, order.publicToken);
  const paymentUrl = requiresPrepayment(order.paymentMethod)
    ? buildPublicOrderUrl("pembayaran", order.code, order.publicToken)
    : trackingUrl;

  return NextResponse.json(
    {
      success: true,
      data: {
        code: order.code,
        token: order.publicToken,
        trackingUrl,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: order.status,
        whatsappUrl: buildWhatsAppUrl(buildOrderMessage(order)),
        paymentUrl,
      },
    },
    { status: 201 },
  );
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/orders — daftar pesanan untuk admin (filter + paginasi).
// Lihat docs/11_API_SPEC.md §11.3.
export async function GET(request: Request): Promise<NextResponse> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return jsonError(401, "UNAUTHORIZED", "Khusus admin. Silakan login ulang.");
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const dariParam = url.searchParams.get("dari") ?? url.searchParams.get("tanggal");
  const sampaiParam = url.searchParams.get("sampai");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);

  if (statusParam !== null && !isOrderStatus(statusParam)) {
    return jsonError(400, "VALIDATION_ERROR", "Status tidak dikenal.");
  }
  if (dariParam !== null && !DATE_PATTERN.test(dariParam)) {
    return jsonError(400, "VALIDATION_ERROR", "Format tanggal harus YYYY-MM-DD.");
  }
  if (sampaiParam !== null && !DATE_PATTERN.test(sampaiParam)) {
    return jsonError(400, "VALIDATION_ERROR", "Format tanggal harus YYYY-MM-DD.");
  }

  try {
    const result = await listOrders({
      ...(statusParam ? { status: statusParam } : {}),
      ...(dariParam ? { dari: dariParam } : {}),
      ...(sampaiParam ? { sampai: sampaiParam } : {}),
      q: url.searchParams.get("q") ?? undefined,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    if (!result) {
      return jsonError(
        503,
        "FITUR_BELUM_AKTIF",
        "Database belum dikonfigurasi. Ikuti docs/19_SETUP_MANUAL.md.",
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: result.orders.map(omitPublicToken),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
        },
      },
    });
  } catch (error) {
    if (error instanceof AdminError) {
      return jsonError(error.statusCode, error.code, error.message);
    }
    console.error("[GET /api/orders]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal memuat daftar pesanan.");
  }
}
