import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
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
// add-on. supabase-js tanpa transaksi → kegagalan langkah lanjutan dibersihkan
// dengan menghapus item yang baru dibuat (cascade menghapus varian/junction).
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

  const inserted = await supabase
    .from("menu_items")
    .insert({
      id: input.id,
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      base_price: input.basePrice,
      image_path: "",
      available: true,
      is_best_seller: input.isBestSeller,
      is_addon_item: input.isAddOnItem,
      unit: input.unit,
      sort_order: input.sortOrder,
      archived: false,
    })
    .select("id")
    .single();

  if (inserted.error) {
    if (isUniqueViolation(inserted.error)) {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_SLUG", message: "ID item sudah dipakai." },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/menu/items]", inserted.error.message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan item." },
      { status: 500 },
    );
  }

  const itemId = inserted.data.id as string;
  const variants = input.variants as MenuVariantInput[];

  try {
    if (variants.length > 0) {
      const variantRows = variants.map((variant) => ({
        id: variant.id,
        item_id: itemId,
        name: variant.name,
        price: variant.price,
        sort_order: variant.sortOrder,
      }));
      const variantInsert = await supabase.from("menu_variants").insert(variantRows);
      if (variantInsert.error) throw variantInsert.error;
    }

    if (input.addOnIds.length > 0) {
      const junctionRows = input.addOnIds.map((addonId) => ({
        item_id: itemId,
        addon_id: addonId,
      }));
      const junctionInsert = await supabase.from("menu_item_addons").insert(junctionRows);
      if (junctionInsert.error) throw junctionInsert.error;
    }
  } catch (error) {
    await supabase.from("menu_items").delete().eq("id", itemId);
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { success: false, error: "DUPLICATE_SLUG", message: "ID varian sudah dipakai untuk item ini." },
        { status: 409 },
      );
    }
    if (isForeignKeyViolation(error)) {
      return NextResponse.json(
        { success: false, error: "ADDON_NOT_FOUND", message: "Add-on tidak dikenal." },
        { status: 404 },
      );
    }
    console.error("[POST /api/admin/menu/items:children]", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan varian/add-on." },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: { id: itemId } }, { status: 201 });
}
