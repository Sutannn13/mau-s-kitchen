import { NextResponse } from "next/server";

import { AdminError, listOrders } from "@/lib/admin/orders";
import { menu } from "@/lib/menu";
import { getFreshAvailabilityOverrides, isItemAvailable } from "@/lib/menu-availability";
import { generateOrderCode, saveOrder } from "@/lib/order-store";
import { isOrderStatus } from "@/lib/order-status";
import { cartSubtotal } from "@/lib/pricing";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { verifyAdminRequest } from "@/lib/supabase/auth";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { createOrderSchema } from "@/lib/validations";
import type { MenuVariant } from "@/types/menu";
import type { CartItem } from "@/types/order";

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

// POST /api/orders — harga SELALU dihitung ulang dari data/menu.json,
// klien tidak mengirim nilai harga. Lihat docs/11_API_SPEC.md §11.2.
export async function POST(request: Request): Promise<NextResponse> {
  if (isRateLimited(getClientIp(request.headers))) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi ya.",
    );
  }

  let body: CreateOrderRequestBody;
  try {
    body = (await request.json()) as CreateOrderRequestBody;
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "Format permintaan tidak valid.");
  }

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

  // Ketersediaan segar dari menu_overrides (no-store) agar toggle "Habis"
  // admin langsung memblokir checkout (docs/14 §14.4).
  const availabilityOverrides = await getFreshAvailabilityOverrides();

  // Validasi item terhadap data menu; item tak dikenal → 400, item habis → 409
  // dengan daftar id (docs/11_API_SPEC.md §11.2).
  const unavailableIds: string[] = [];
  const cartItems: CartItem[] = [];
  let unknownItemId: string | null = null;

  for (const line of payload.items) {
    const menuItem = menu.items.find((item) => item.id === line.itemId);
    if (!menuItem) {
      unknownItemId = line.itemId;
      break;
    }
    if (!isItemAvailable(menuItem, availabilityOverrides)) {
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
  // Ongkir Fase 1 selalu null (dikonfirmasi admin, BR-05).
  const order = {
    code: await generateOrderCode(now),
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
    deliveryFee: null,
    total: subtotal,
    paymentMethod: payload.paymentMethod,
    status: "BARU" as const,
    updatedAt: now.toISOString(),
  };

  await saveOrder(order);

  const paymentUrl =
    order.paymentMethod === "tunai"
      ? `/pesanan/${order.code}`
      : `/pembayaran/${order.code}`;

  return NextResponse.json(
    {
      success: true,
      data: {
        code: order.code,
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
        orders: result.orders,
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
