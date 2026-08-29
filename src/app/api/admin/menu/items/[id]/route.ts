import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  requireAdminService,
  updateMenuItemAtomically,
} from "@/lib/admin/menu";
import { updateMenuItemSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function categoryIsAvailable(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("archived", false)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return Boolean(data);
}

async function addOnsExist(supabase: SupabaseClient, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const { data, error } = await supabase
    .from("menu_addons")
    .select("id")
    .in("id", ids);
  if (error) throw error;
  const found = (data ?? []).map((row) => (row as { id: string }).id);
  return ids.every((id) => found.includes(id));
}

// PATCH /api/admin/menu/items/[id] — ubah item (nama, harga, ketersediaan,
// varian, add-on, urutan, best seller, arsip). Varian & tautan add-on yang
// dikirim akan menggantikan seluruh relasi lama (replace semantics).
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

  const parsed = updateMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  try {
    if (patch.categoryId !== undefined && !(await categoryIsAvailable(supabase, patch.categoryId))) {
      return NextResponse.json(
        { success: false, error: "CATEGORY_NOT_FOUND", message: "Kategori tidak dikenal atau diarsip." },
        { status: 404 },
      );
    }
    if (patch.addOnIds !== undefined && !(await addOnsExist(supabase, patch.addOnIds))) {
      return NextResponse.json(
        { success: false, error: "ADDON_NOT_FOUND", message: "Ada add-on yang tidak dikenal." },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("[PATCH /api/admin/menu/items/:id:lookup]", { error });
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal memeriksa data menu." },
      { status: 500 },
    );
  }
  if (patch.variants !== undefined) {
    const variantIds = new Set(patch.variants.map((variant) => variant.id));
    if (variantIds.size !== patch.variants.length) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "ID varian tidak boleh duplikat." },
        { status: 400 },
      );
    }
  }

  // Pengecekan eksistensi item (termasuk arsip — admin boleh edit item arsip).
  const exists = await supabase.from("menu_items").select("id").eq("id", id).maybeSingle();
  if (exists.error) {
    console.error("[PATCH /api/admin/menu/items/:id:exists]", { error: exists.error });
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal memeriksa item menu." },
      { status: 500 },
    );
  }
  if (!exists.data) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "Item menu tidak ditemukan." },
      { status: 404 },
    );
  }

  const row: Record<string, unknown> = {};
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.basePrice !== undefined) row.base_price = patch.basePrice;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.isBestSeller !== undefined) row.is_best_seller = patch.isBestSeller;
  if (patch.isAddOnItem !== undefined) row.is_addon_item = patch.isAddOnItem;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.available !== undefined) row.available = patch.available;
  if (patch.archived !== undefined) row.archived = patch.archived;

  const updateError = await updateMenuItemAtomically(supabase, {
    itemId: id,
    itemPatch: row,
    variants: patch.variants,
    addOnIds: patch.addOnIds,
  });
  if (updateError) {
    const code =
      typeof updateError === "object" &&
      updateError !== null &&
      "code" in updateError
        ? String((updateError as { code: unknown }).code)
        : "";
    if (code === "P0002") {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Item menu tidak ditemukan." },
        { status: 404 },
      );
    }
    if (code === "23503" || code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "MENU_CONFLICT",
          message: "Data kategori, varian, atau add-on berubah. Muat ulang lalu coba lagi.",
        },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/admin/menu/items/:id]", { error: updateError });
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal menyimpan item." },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: { id } });
}

// DELETE /api/admin/menu/items/[id] — arsip (soft delete: archived=true).
// Item arsip tetap ada di DB + pesanan lama tetap punya nama item tercatat.
export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const guard = await requireAdminService(request);
  if (!guard.ok) {
    return guard.response;
  }
  const { supabase } = guard;
  const { id } = await context.params;

  const deleted = await supabase
    .from("menu_items")
    .update({ archived: true })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (deleted.error) {
    console.error("[DELETE /api/admin/menu/items/:id]", deleted.error.message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Gagal mengarsipkan item." },
      { status: 500 },
    );
  }
  if (!deleted.data) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "Item menu tidak ditemukan." },
      { status: 404 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: { id, archived: true } });
}
