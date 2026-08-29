import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { isUniqueViolation, requireAdminService } from "@/lib/admin/menu";
import { getAdminAddOns } from "@/lib/menu-data";
import { createAddOnSchema } from "@/lib/validations";

// GET /api/admin/menu/addons — daftar add-on global.
export async function GET(request: Request): Promise<NextResponse> {
  const guard = await requireAdminService(request);
  if (!guard.ok) {
    return guard.response;
  }

  const addOns = await getAdminAddOns();
  if (!addOns) {
    return NextResponse.json(
      { success: false, error: "MENU_STORE_UNAVAILABLE", message: "Gagal memuat add-on." },
      { status: 503 },
    );
  }

  return NextResponse.json({ success: true, data: { addOns } });
}

// POST /api/admin/menu/addons — buat add-on global baru.
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

  const parsed = createAddOnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const inserted = await supabase
    .from("menu_addons")
    .insert({ id: input.id, name: input.name, price: input.price })
    .select("id,name,price")
    .single();

  if (inserted.error) {
    if (isUniqueViolation(inserted.error)) {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_SLUG", message: "ID add-on sudah dipakai." },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/menu/addons]", inserted.error.message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan add-on." },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: inserted.data }, { status: 201 });
}
