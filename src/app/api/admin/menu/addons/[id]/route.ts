import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminService } from "@/lib/admin/menu";
import { updateAddOnSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/menu/addons/[id] — ubah nama/harga add-on.
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

  const parsed = updateAddOnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.price !== undefined) row.price = patch.price;

  const updated = await supabase
    .from("menu_addons")
    .update(row)
    .eq("id", id)
    .select("id,name,price")
    .maybeSingle();

  if (updated.error) {
    console.error("[PATCH /api/admin/menu/addons/:id]", updated.error.message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan add-on." },
      { status: 500 },
    );
  }
  if (!updated.data) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "Add-on tidak ditemukan." },
      { status: 404 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: updated.data });
}
