import { NextResponse } from "next/server";

import { getAdminMenu } from "@/lib/menu-data";
import { requireAdminService } from "@/lib/admin/menu";

// GET /api/admin/menu — daftar kategori + item + varian + add-on global
// (termasuk arsip) untuk dashboard admin. Lihat docs/11_API_SPEC.md §11.8.
export async function GET(
  request: Request,
): Promise<NextResponse> {
  const guard = await requireAdminService(request);
  if (!guard.ok) {
    return guard.response;
  }

  const result = await getAdminMenu();
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error:
          result.reason === "migration-pending"
            ? "MIGRATION_PENDING"
            : "MENU_STORE_UNAVAILABLE",
        message:
          result.reason === "migration-pending"
            ? "Tabel menu belum dibuat. Jalankan migration 20260817_menu_crud.sql di Supabase SQL Editor."
            : "Gagal memuat katalog dari database.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ success: true, data: result.menu });
}
