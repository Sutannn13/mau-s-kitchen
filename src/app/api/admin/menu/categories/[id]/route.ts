import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminService } from "@/lib/admin/menu";
import { updateCategorySchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/menu/categories/[id] — ubah nama/tagline/gambar/urutan
// atau arsip/restore kategori (archived true/false).
export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const guard = await requireAdminService(request);
  if (!guard.ok) {
    return guard.response;
  }
  const { supabase } = guard;
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  // Cegah arsip kategori yang masih punya item aktif (docs/03 §FR-27 risk).
  if (patch.archived === true) {
    const activeCount = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id)
      .eq("archived", false);

    if ((activeCount.count ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: "CATEGORY_NOT_EMPTY", message: "Kategori masih punya item aktif. Arsipkan item dulu." },
        { status: 409 },
      );
    }
  }

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.tagline !== undefined) row.tagline = patch.tagline;
  if (patch.image !== undefined) row.image = patch.image;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.archived !== undefined) row.archived = patch.archived;

  const updated = await supabase
    .from("menu_categories")
    .update(row)
    .eq("id", id)
    .select("id,name,tagline,image,sort_order,archived,updated_at")
    .maybeSingle();

  if (updated.error) {
    console.error("[PATCH /api/admin/menu/categories/:id]", updated.error.message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan kategori." },
      { status: 500 },
    );
  }
  if (!updated.data) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "Kategori tidak ditemukan." },
      { status: 404 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: updated.data });
}
