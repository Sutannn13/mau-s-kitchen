import { NextResponse } from "next/server";

import { AdminError, updateOrder } from "@/lib/admin/orders";
import { isValidOrderAccessToken } from "@/lib/order-access";
import { isValidOrderCode } from "@/lib/order-code";
import {
  getOrderByPublicAccess,
  OrderStoreUnavailableError,
} from "@/lib/order-store";
import { getClientIp, isPublicReadRateLimited } from "@/lib/rate-limit";
import { verifyAdminRequest } from "@/lib/supabase/auth";
import { patchOrderSchema } from "@/lib/validations";
import type { Order } from "@/types/order";

function jsonError(
  status: number,
  error: string,
  message: string,
): NextResponse {
  return NextResponse.json(
    { success: false, error, message },
    { status, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

function omitPublicToken(order: Order): Omit<Order, "publicToken"> {
  const { publicToken, ...safeOrder } = order;
  void publicToken;
  return safeOrder;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ kode: string }> },
): Promise<NextResponse> {
  const { kode } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!isValidOrderCode(kode) || !isValidOrderAccessToken(token)) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }
  if (
    await isPublicReadRateLimited(
      "ORDER_READ_RATE_LIMITER",
      `order-read:${getClientIp(request.headers)}`,
      { maxRequests: 120, windowSeconds: 60 },
    )
  ) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
    );
  }

  let order;
  try {
    order = await getOrderByPublicAccess(kode, token);
  } catch (error) {
    if (error instanceof OrderStoreUnavailableError) {
      return jsonError(
        503,
        "ORDER_STORE_UNAVAILABLE",
        "Pelacakan pesanan sedang tidak tersedia.",
      );
    }
    throw error;
  }

  if (!order) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }

  const publicOrder = {
    code: order.code,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      name: item.name,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      addOns: item.addOns.map(({ name, price }) => ({ name, price })),
      quantity: item.quantity,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    deliveryProvider: order.deliveryProvider,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentProofSubmitted: Boolean(order.paymentProofUrl),
    paymentClaimed: Boolean(order.paymentClaimedAt),
    status: order.status,
    updatedAt: order.updatedAt,
  };

  return NextResponse.json(
    { success: true, data: publicOrder },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ kode: string }> },
): Promise<NextResponse> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return jsonError(401, "UNAUTHORIZED", "Khusus admin. Silakan login ulang.");
  }

  const { kode } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "Format permintaan tidak valid.");
  }

  const parsed = patchOrderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Perubahan tidak valid.",
    );
  }

  try {
    const updated = await updateOrder(kode, parsed.data);
    if (!updated) {
      return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
    }
    return NextResponse.json({ success: true, data: omitPublicToken(updated) });
  } catch (error) {
    if (error instanceof AdminError) {
      return jsonError(error.statusCode, error.code, error.message);
    }
    console.error("[PATCH /api/orders/:kode]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan perubahan.");
  }
}
