import { NextResponse } from "next/server";

import { getAllItemsWithOverrides } from "@/lib/menu-availability";
import { menu } from "@/lib/menu";

// GET /api/menu — katalog + status ketersediaan terkini (docs/11 §11.7).
export async function GET(): Promise<NextResponse> {
  const items = await getAllItemsWithOverrides();

  return NextResponse.json(
    {
      success: true,
      data: {
        version: menu.version,
        updatedAt: menu.updatedAt,
        currency: menu.currency,
        categories: menu.categories,
        items,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
