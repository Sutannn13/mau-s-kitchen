import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { isUniqueViolation, requireAdminService } from "@/lib/admin/menu";
import { createCategorySchema } from "@/lib/validations";

// POST /api/admin/menu/categories — buat kategori baru.
export async function POST(request: Request): Promise<NextResponse> {
  const guard = await requireAdminService(request);
  if (!guard.ok) {
    return guard.response;
  }
  const { supabase } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const inserted = await supabase
    .from("menu_categories")
    .insert({
      id: input.id,
      name: input.name,
      tagline: input.tagline,
      image: input.image,
      sort_order: input.sortOrder,
      archived: false,
    })
    .select("id,name,tagline,image,sort_order,archived,updated_at")
    .single();

  if (inserted.error) {
    if (isUniqueViolation(inserted.error)) {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_SLUG", message: "ID kategori sudah dipakai." },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/menu/categories]", inserted.error.message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan kategori." },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: inserted.data }, { status: 201 });
}
