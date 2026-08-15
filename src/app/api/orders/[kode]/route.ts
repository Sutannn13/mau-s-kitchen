import { NextResponse } from "next/server";

import { AdminError, updateOrder } from "@/lib/admin/orders";
import { getOrderByCode } from "@/lib/order-store";
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
    { status },
  );
}

// Data sensitif disamarkan untuk pelacakan publik: nomor WhatsApp dan alamat
// hanya tampil sebagian. Lihat docs/11_API_SPEC.md §11.4.
function maskWhatsapp(whatsapp: string): string {
  if (whatsapp.length < 7) {
    return "****";
  }
  return `${whatsapp.slice(0, 4)}****${whatsapp.slice(-3)}`;
}

function maskAddress(address: string | undefined): string | undefined {
  if (!address) {
    return undefined;
  }
  return address.length <= 12 ? address : `${address.slice(0, 12)}…`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ kode: string }> },
): Promise<NextResponse> {
  const { kode } = await context.params;
  const order = await getOrderByCode(kode);

  if (!order) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }

  const maskedOrder: Order = {
    ...order,
    customer: {
      ...order.customer,
      whatsapp: maskWhatsapp(order.customer.whatsapp),
      address: maskAddress(order.customer.address),
      addressNote: undefined,
      note: undefined,
    },
    adminNote: undefined,
  };

  return NextResponse.json({ success: true, data: maskedOrder });
}

// PATCH oleh admin: ubah status / catatan admin / ongkir. Transisi status
// divalidasi terhadap state machine; total dihitung ulang server saat ongkir
// diisi (docs/11_API_SPEC.md §11.5).
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
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AdminError) {
      return jsonError(error.statusCode, error.code, error.message);
    }
    console.error("[PATCH /api/orders/:kode]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan perubahan.");
  }
}
