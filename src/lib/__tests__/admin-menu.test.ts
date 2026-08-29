import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { updateMenuItemAtomically } from "@/lib/admin/menu";

describe("updateMenuItemAtomically", () => {
  it("mengirim header, varian, dan add-on dalam satu panggilan RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await expect(
      updateMenuItemAtomically(supabase, {
        itemId: "chocoberry",
        itemPatch: { name: "ChocoBerry", base_price: 25000 },
        variants: [
          { id: "small", name: "Small", price: 25000, sortOrder: 1 },
        ],
        addOnIds: ["keju"],
      }),
    ).resolves.toBeNull();

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("admin_update_menu_item", {
      p_item_id: "chocoberry",
      p_item_patch: { name: "ChocoBerry", base_price: 25000 },
      p_variants: [
        {
          id: "small",
          name: "Small",
          price: 25000,
          sort_order: 1,
        },
      ],
      p_addon_ids: ["keju"],
    });
  });

  it("mengembalikan error RPC agar route tidak melaporkan sukses palsu", async () => {
    const databaseError = { code: "23503", message: "foreign key" };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ error: databaseError }),
    } as unknown as SupabaseClient;

    await expect(
      updateMenuItemAtomically(supabase, {
        itemId: "chocoberry",
        itemPatch: {},
        addOnIds: ["tidak-ada"],
      }),
    ).resolves.toBe(databaseError);
  });
});
