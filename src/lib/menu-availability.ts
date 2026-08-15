import { getItemsByCategory, menu } from "@/lib/menu";
import type { CategoryId, MenuItem } from "@/types/menu";

// Penggabungan data/menu.json dengan tabel menu_overrides di Supabase.
// Ketersediaan yang diubah admin wajib tampil di sisi pelanggan maksimal
// 60 detik (docs/14_ADMIN_DASHBOARD.md §14.4) → halaman memakai fetch dengan
// revalidate 60, sedangkan POST /api/orders memakai no-store agar checkout
// selalu melihat status segar.

interface OverrideRow {
  item_id: string;
  available: boolean;
}

interface SupabaseRestConfig {
  baseUrl: string;
  apikey: string;
}

// Anon key cukup: policy menu_overrides_public_read mengizinkan baca publik
// (docs/10_DATA_MODEL.md §10.4). Tidak ada kunci rahasia di sisi klien.
function getSupabaseRestConfig(): SupabaseRestConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !apikey) {
    return null;
  }
  return {
    baseUrl: `${url.replace(/\/+$/, "")}/rest/v1`,
    apikey,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseRestConfig() !== null;
}

async function fetchOverrides(options: {
  noStore: boolean;
}): Promise<Map<string, boolean>> {
  const config = getSupabaseRestConfig();
  if (config === null) {
    return new Map();
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/menu_overrides?select=item_id,available`,
      {
        headers: {
          apikey: config.apikey,
          Authorization: `Bearer ${config.apikey}`,
        },
        ...(options.noStore
          ? { cache: "no-store" as const }
          : { next: { revalidate: 60 } }),
      },
    );

    if (!response.ok) {
      console.warn(
        `[menu-availability] Supabase merespons ${response.status}; memakai ketersediaan menu.json.`,
      );
      return new Map();
    }

    const rows = (await response.json()) as OverrideRow[];
    const overrides = new Map<string, boolean>();
    for (const row of rows) {
      overrides.set(row.item_id, row.available);
    }
    return overrides;
  } catch (error) {
    // Kegagalan jaringan/DB tidak boleh membuat katalog ikut gagal —
    // kembali ke ketersediaan dari menu.json.
    console.warn("[menu-availability] gagal membaca override:", error);
    return new Map();
  }
}

// Versi cache (ISR 60 detik) untuk halaman katalog pelanggan.
export async function getAvailabilityOverrides(): Promise<Map<string, boolean>> {
  return fetchOverrides({ noStore: false });
}

// Versi tanpa cache untuk validasi checkout di server.
export async function getFreshAvailabilityOverrides(): Promise<Map<string, boolean>> {
  return fetchOverrides({ noStore: true });
}

// Jangan mutasi objek menu.json bersama — klon hanya item yang di-override.
export function applyOverrides(
  items: readonly MenuItem[],
  overrides: ReadonlyMap<string, boolean>,
): MenuItem[] {
  return items.map((item) =>
    overrides.has(item.id)
      ? { ...item, available: overrides.get(item.id) === true }
      : item,
  );
}

export function applyOverrideToItem(
  item: MenuItem,
  overrides: ReadonlyMap<string, boolean>,
): MenuItem {
  return applyOverrides([item], overrides)[0] ?? item;
}

// Ketersediaan efektif satu item: override admin menang atas menu.json.
export function isItemAvailable(
  item: MenuItem,
  overrides: ReadonlyMap<string, boolean>,
): boolean {
  return overrides.get(item.id) ?? item.available;
}

export async function getItemsByCategoryWithOverrides(
  categoryId: CategoryId,
): Promise<MenuItem[]> {
  return applyOverrides(
    getItemsByCategory(categoryId),
    await getAvailabilityOverrides(),
  );
}

export async function getAllItemsWithOverrides(): Promise<MenuItem[]> {
  return applyOverrides(menu.items, await getAvailabilityOverrides());
}
