import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { createMenuItemAtomically } from "@/lib/admin/menu";

describe("createMenuItemAtomically", () => {
  const item = {
    id: "taichan-daging",
    categoryId: "taichan",
    name: "Taichan Daging",
    description: "Pedas nampol",
    basePrice: 25000,
    unit: "porsi" as const,
    isBestSeller: true,
    isAddOnItem: false,
    sortOrder: 3,
  };

  it("mengirim item, varian, dan add-on dalam satu panggilan RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    const createError = await createMenuItemAtomically(supabase, {
      item,
      variants: [
        { id: "reguler", name: "Reguler", price: 25000, sortOrder: 1 },
        { id: "jumbo", name: "Jumbo", price: 35000, sortOrder: 2 },
      ],
      addOnIds: ["keju", "sambal-extra"],
    });

    expect(createError).toBeNull();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("admin_create_menu_item", {
      p_item: {
        id: "taichan-daging",
        category_id: "taichan",
        name: "Taichan Daging",
        description: "Pedas nampol",
        base_price: 25000,
        unit: "porsi",
        is_best_seller: true,
        is_addon_item: false,
        sort_order: 3,
      },
      p_variants: [
        { id: "reguler", name: "Reguler", price: 25000, sort_order: 1 },
        { id: "jumbo", name: "Jumbo", price: 35000, sort_order: 2 },
      ],
      p_addon_ids: ["keju", "sambal-extra"],
    });
  });

  it("mengirim p_addon_ids sebagai array kosong saat tidak ada add-on", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await createMenuItemAtomically(supabase, {
      item,
      variants: [],
      addOnIds: [],
    });

    expect(rpc).toHaveBeenCalledWith(
      "admin_create_menu_item",
      expect.objectContaining({ p_addon_ids: [] }),
    );
  });

  it("mengembalikan error RPC agar route tidak melaporkan sukses palsu", async () => {
    const databaseError = { code: "23505", message: "duplicate key" };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ error: databaseError }),
    } as unknown as SupabaseClient;

    const createError = await createMenuItemAtomically(supabase, {
      item,
      variants: [],
      addOnIds: [],
    });

    expect(createError).toBe(databaseError);
  });
});
