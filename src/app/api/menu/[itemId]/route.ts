import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getMenu } from "@/lib/menu-data";
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
// Setelah migrasi, field `available` disimpan langsung di menu_items.available.
// Endpoint ini tetap dipertahankan untuk toggle cepat; CRUD penuh ada di
// /api/admin/menu/items/[id].
export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
): Promise<NextResponse> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return jsonError(401, "UNAUTHORIZED", "Khusus admin. Silakan login ulang.");
  }

  const { itemId } = await context.params;

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

  // Validasi eksistensi item langsung dari DB (termasuk arsip — admin tetap
  // boleh toggle item yang sedang diarsip untuk persiapan unggah ulang).
  const existing = await supabase
    .from("menu_items")
    .select("id")
    .eq("id", itemId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return jsonError(404, "NOT_FOUND", "Item menu tidak dikenal.");
  }

  const saved = await supabase
    .from("menu_items")
    .update({ available: parsed.data.available })
    .eq("id", itemId);

  if (saved.error) {
    console.error("[PATCH /api/menu/:itemId]", saved.error.message);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan perubahan.");
  }

  // Referensi async agar pemeriksaan item lama tetap valid (mis. saat DB down).
  await getMenu({ noStore: true }).catch(() => {
    // fail-open: ISR tetap di-bust di bawah.
  });
  revalidatePath("/", "layout");

  return NextResponse.json({
    success: true,
    data: { itemId, available: parsed.data.available },
  });
}
