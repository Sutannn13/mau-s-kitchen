import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getMenuItemById } from "@/lib/menu";
import { getServiceClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/supabase/auth";
import { patchMenuItemSchema } from "@/lib/validations";

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

// PATCH /api/menu/[itemId] — toggle ketersediaan oleh admin (docs/11 §11.1).
// Disimpan ke menu_overrides; halaman katalog di-revalidate agar perubahan
// tampil lebih cepat dari jendela ISR 60 detik (docs/14 §14.4).
export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
): Promise<NextResponse> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return jsonError(401, "UNAUTHORIZED", "Khusus admin. Silakan login ulang.");
  }

  const { itemId } = await context.params;
  if (!getMenuItemById(itemId)) {
    return jsonError(404, "NOT_FOUND", "Item menu tidak dikenal.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "Format permintaan tidak valid.");
  }

  const parsed = patchMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Nilai ketersediaan tidak valid.");
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return jsonError(
      503,
      "FITUR_BELUM_AKTIF",
      "Database belum dikonfigurasi. Ikuti docs/19_SETUP_MANUAL.md.",
    );
  }

  const saved = await supabase.from("menu_overrides").upsert({
    item_id: itemId,
    available: parsed.data.available,
    updated_at: new Date().toISOString(),
  });

  if (saved.error) {
    console.error("[PATCH /api/menu/:itemId]", saved.error.message);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan perubahan.");
  }

  revalidatePath("/", "layout");

  return NextResponse.json({
    success: true,
    data: { itemId, available: parsed.data.available },
  });
}
