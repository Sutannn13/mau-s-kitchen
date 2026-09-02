import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createMenuItemAtomically,
  isForeignKeyViolation,
  isUniqueViolation,
  requireAdminService,
} from "@/lib/admin/menu";
import { createMenuItemSchema, type MenuVariantInput } from "@/lib/validations";

async function categoryIsAvailable(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("archived", false)
    .maybeSingle();
  return Boolean(data);
}

async function addOnsExist(supabase: SupabaseClient, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const { data, error } = await supabase
    .from("menu_addons")
    .select("id")
    .in("id", ids);
  if (error) return false;
  const found = (data ?? []).map((row) => (row as { id: string }).id);
  return ids.every((id) => found.includes(id));
}

// POST /api/admin/menu/items — buat item menu baru beserta varian & tautan
// add-on melalui satu RPC agar tidak ada item parsial yang terlihat publik.
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

  const parsed = createMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (!(await categoryIsAvailable(supabase, input.categoryId))) {
    return NextResponse.json(
      { success: false, error: "CATEGORY_NOT_FOUND", message: "Kategori tidak dikenal atau diarsip." },
      { status: 404 },
    );
  }
  if (!(await addOnsExist(supabase, input.addOnIds))) {
    return NextResponse.json(
      { success: false, error: "ADDON_NOT_FOUND", message: "Ada add-on yang tidak dikenal." },
      { status: 404 },
    );
  }

  const variantIds = new Set(input.variants.map((variant) => variant.id));
  if (variantIds.size !== input.variants.length) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "ID varian tidak boleh duplikat." },
      { status: 400 },
    );
  }

  const variants = input.variants as MenuVariantInput[];
  const createError = await createMenuItemAtomically(supabase, {
    item: input,
    variants,
    addOnIds: input.addOnIds,
  });
  if (createError) {
    if (isUniqueViolation(createError)) {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_SLUG", message: "ID item atau varian sudah dipakai." },
        { status: 409 },
      );
    }
    if (isForeignKeyViolation(createError)) {
      return NextResponse.json(
        {
          success: false,
          error: "MENU_CONFLICT",
          message: "Kategori atau add-on berubah. Muat ulang lalu coba lagi.",
        },
        { status: 409 },
      );
    }
    const code =
      typeof createError === "object" &&
      createError !== null &&
      "code" in createError
        ? String((createError as { code: unknown }).code)
        : "";
    if (code === "22023") {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "Data menu tidak valid." },
        { status: 400 },
      );
    }
    console.error("[POST /api/admin/menu/items]", { error: createError });
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan item." },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: { id: input.id } }, { status: 201 });
}
