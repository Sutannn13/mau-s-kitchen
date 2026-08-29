import { NextResponse } from "next/server";

import { getCachedMenu } from "@/lib/menu-data";

// GET /api/menu — katalog + status ketersediaan terkini (docs/11 §11.7).
// Sumber kebenaran: tabel menu_items di Supabase dengan fallback JSON.
export async function GET(): Promise<NextResponse> {
  const loaded = await getCachedMenu();

  return NextResponse.json(
    {
      success: true,
      data: {
        version: loaded.version,
        updatedAt: loaded.updatedAt,
        currency: loaded.currency,
        brand: loaded.brand,
        categories: loaded.categories,
        items: loaded.items,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
