import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getServiceClient } from "@/lib/supabase/admin";
import { verifyAdminRequest } from "@/lib/supabase/auth";

// Helper bersama untuk route handler admin menu. Mengikuti pola guard yang
// sama dengan src/app/api/menu/[itemId]/route.ts tetapi dipusatkan agar tidak
// diduplikasi di 8 endpoint. Lihat docs/11_API_SPEC.md §11.8.

export function adminJsonError(
  status: number,
  error: string,
  message: string,
): NextResponse {
  return NextResponse.json({ success: false, error, message }, { status });
}

export type AdminGuardResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

// Verifikasi sesi admin + ketersediaan service client. Mengembalikan respons
// error siap pakai bila gagal, sehingga route handler cukup `return` saja.
export async function requireAdminService(
  request: Request,
): Promise<AdminGuardResult> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return {
      ok: false,
      response: adminJsonError(
        401,
        "UNAUTHORIZED",
        "Khusus admin. Silakan login ulang.",
      ),
    };
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return {
      ok: false,
      response: adminJsonError(
        503,
        "FITUR_BELUM_AKTIF",
        "Database belum dikonfigurasi. Ikuti docs/19_SETUP_MANUAL.md.",
      ),
    };
  }

  return { ok: true, supabase };
}

// Kode error Postgres untuk pelanggaran constraint unik (primary key / unique).
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === PG_UNIQUE_VIOLATION
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === PG_FOREIGN_KEY_VIOLATION
  );
}

export interface AtomicMenuVariant {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface AtomicMenuItemUpdate {
  itemId: string;
  itemPatch: Record<string, unknown>;
  variants?: readonly AtomicMenuVariant[];
  addOnIds?: readonly string[];
}

// Satu RPC berarti update header + replace variants/add-ons berada dalam satu
// transaksi PostgreSQL. Pecah hanya bila domain menu kelak punya write lain.
export async function updateMenuItemAtomically(
  supabase: SupabaseClient,
  input: AtomicMenuItemUpdate,
): Promise<unknown | null> {
  const result = await supabase.rpc("admin_update_menu_item", {
    p_item_id: input.itemId,
    p_item_patch: input.itemPatch,
    p_variants:
      input.variants === undefined
        ? null
        : input.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            sort_order: variant.sortOrder,
          })),
    p_addon_ids: input.addOnIds ?? null,
  });
  return result.error;
}
