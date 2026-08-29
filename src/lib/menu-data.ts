import menuJson from "../../data/menu.json";

import { getAuthorizedAdminServiceClient } from "@/lib/supabase/current-admin";
import type {
  CategoryId,
  MenuAddOn,
  MenuCategory,
  MenuItem,
  MenuVariant,
} from "@/types/menu";

// Sumber kebenaran katalog sekarang tabel Supabase (menu_items +
// relasi). data/menu.json tetap dipakai sebagai seed awal + fallback
// read-only bila Supabase tidak tersedia. Lihat docs/10_DATA_MODEL.md §10.3.

const menuFallback = menuJson as unknown as {
  version: string;
  updatedAt: string;
  currency: "IDR";
  brand: MenuDataBrand;
  categories: MenuCategory[];
  items: MenuItem[];
};

interface MenuDataBrand {
  name: string;
  tagline: string;
  whatsapp: string;
  whatsappDisplay: string;
}

export interface LoadedMenu {
  version: string;
  updatedAt: string;
  currency: "IDR";
  brand: MenuDataBrand;
  categories: MenuCategory[];
  items: MenuItem[];
  source: "db" | "fallback";
}

export class MenuStoreUnavailableError extends Error {
  constructor() {
    super("Penyimpanan menu tidak dapat diakses.");
  }
}

// ---------------------------------------------------------------------
// REST config (anon key) — publik baca lewat RLS, tidak bocor service key.
// Mengikuti pola src/lib/menu-availability.ts.
// ---------------------------------------------------------------------
interface SupabaseRestConfig {
  baseUrl: string;
  apikey: string;
}

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

export function isMenuDbConfigured(): boolean {
  return getSupabaseRestConfig() !== null;
}

// ---------------------------------------------------------------------
// Row shapes (PostgREST response)
// ---------------------------------------------------------------------
interface VariantRow {
  id: string;
  name: string;
  price: number;
  sort_order: number;
}

interface AddOnLinkRow {
  addon: { id: string; name: string; price: number } | null;
}

interface ItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  image_path: string;
  available: boolean;
  is_best_seller: boolean;
  is_addon_item: boolean;
  unit: "porsi" | "cup" | "item";
  sort_order: number;
  archived: boolean;
  updated_at: string | null;
  variants: VariantRow[];
  item_addons: AddOnLinkRow[];
}

interface CategoryRow {
  id: string;
  name: string;
  tagline: string;
  image: string;
  sort_order: number;
  archived: boolean;
  updated_at: string | null;
}

// Embed PostgREST wajib memakai nama relasi asli (nama tabel anak/junction)
// lalu di-alias: menu_variants → "variants", menu_addons → "addon".
// Tanpa alias, PostgREST mencari relasi bernama "variants" dan gagal
// ("Could not find a relationship ... in the schema cache").
const ITEM_SELECT =
  "id,category_id,name,description,base_price,image_path,available,is_best_seller,is_addon_item,unit,sort_order,archived,updated_at," +
  "variants:menu_variants(id,name,price,sort_order)," +
  "item_addons:menu_item_addons(addon:menu_addons(id,name,price))";

function rowToItem(row: ItemRow): MenuItem {
  const variants: MenuVariant[] = (row.variants ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      sortOrder: v.sort_order,
    }));

  const addOns: MenuAddOn[] = (row.item_addons ?? [])
    .map((link) => link.addon)
    .filter(
      (addon): addon is { id: string; name: string; price: number } =>
        addon !== null &&
        typeof addon.id === "string" &&
        typeof addon.name === "string" &&
        typeof addon.price === "number",
    )
    .map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price,
    }));

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? "",
    basePrice: row.base_price,
    variants,
    addOns,
    image: row.image_path ?? "",
    available: row.available,
    isBestSeller: row.is_best_seller,
    ...(row.is_addon_item ? { isAddOnItem: true } : {}),
    unit: row.unit,
    sortOrder: row.sort_order,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
  };
}

function rowToCategory(row: CategoryRow): MenuCategory {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline ?? "",
    image: row.image ?? "",
    order: row.sort_order,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
  };
}

function buildFallback(): LoadedMenu {
  return {
    version: menuFallback.version,
    updatedAt: menuFallback.updatedAt,
    currency: menuFallback.currency,
    brand: menuFallback.brand,
    categories: menuFallback.categories,
    items: menuFallback.items,
    source: "fallback",
  };
}

// ---------------------------------------------------------------------
// Public read — ISR 60s cache; fail-open ke fallback JSON.
// ---------------------------------------------------------------------
export async function getMenu(options: {
  noStore?: boolean;
  failClosed?: boolean;
} = {}): Promise<LoadedMenu> {
  const config = getSupabaseRestConfig();
  if (config === null) {
    if (options.failClosed) {
      throw new MenuStoreUnavailableError();
    }
    return buildFallback();
  }

  const headers: Record<string, string> = {
    apikey: config.apikey,
    Authorization: `Bearer ${config.apikey}`,
  };
  const fetchOptions: RequestInit = options.noStore
    ? { cache: "no-store" }
    : { next: { revalidate: 60 } };

  try {
    const [catRes, itemRes] = await Promise.all([
      fetch(
        `${config.baseUrl}/menu_categories?select=id,name,tagline,image,sort_order,archived,updated_at&order=sort_order.asc&archived=eq.false`,
        { headers, ...fetchOptions },
      ),
      fetch(
        `${config.baseUrl}/menu_items?select=${ITEM_SELECT}&order=sort_order.asc&archived=eq.false`,
        { headers, ...fetchOptions },
      ),
    ]);

    if (!catRes.ok || !itemRes.ok) {
      if (options.failClosed && process.env.NODE_ENV === "production") {
        throw new MenuStoreUnavailableError();
      }
      console.warn(
        `[menu-data] Supabase merespons ${catRes.status}/${itemRes.status}; memakai fallback menu.json.`,
      );
      return buildFallback();
    }

    const categoryRows = (await catRes.json()) as CategoryRow[];
    const itemRows = (await itemRes.json()) as ItemRow[];

    if (!Array.isArray(categoryRows) || !Array.isArray(itemRows)) {
      if (options.failClosed && process.env.NODE_ENV === "production") {
        throw new MenuStoreUnavailableError();
      }
      return buildFallback();
    }

    const categories = categoryRows.map(rowToCategory);
    const items = itemRows.map(rowToItem);

    return {
      version: menuFallback.version,
      updatedAt: menuFallback.updatedAt,
      currency: menuFallback.currency,
      brand: menuFallback.brand,
      categories,
      items,
      source: "db",
    };
  } catch (error) {
    if (options.failClosed && process.env.NODE_ENV === "production") {
      if (error instanceof MenuStoreUnavailableError) {
        throw error;
      }
      throw new MenuStoreUnavailableError();
    }
    console.warn("[menu-data] gagal membaca katalog dari DB:", error);
    return buildFallback();
  }
}

// Cache (ISR 60s) untuk halaman katalog pelanggan.
export async function getCachedMenu(): Promise<LoadedMenu> {
  return getMenu({ noStore: false });
}

// Tanpa cache + fail-closed untuk checkout: harga tidak boleh pakai fallback
// yang mungkin stale bila DB sebenarnya up.
export async function getFreshMenu(): Promise<LoadedMenu> {
  return getMenu({ noStore: true, failClosed: true });
}

// ---------------------------------------------------------------------
// Helper lookup (async) — pengganti fungsi sinkron di src/lib/menu.ts.
// ---------------------------------------------------------------------
export async function getMenuItemByIdAsync(
  id: string,
  options: { noStore?: boolean; failClosed?: boolean } = {},
): Promise<MenuItem | null> {
  const loaded = await getMenu(options);
  return loaded.items.find((item) => item.id === id) ?? null;
}

export async function getCategoryByIdAsync(
  id: CategoryId,
  options: { noStore?: boolean; failClosed?: boolean } = {},
): Promise<MenuCategory | null> {
  const loaded = await getMenu(options);
  return loaded.categories.find((category) => category.id === id) ?? null;
}

export async function isCategoryIdAsync(
  value: string,
  options: { noStore?: boolean; failClosed?: boolean } = {},
): Promise<boolean> {
  const loaded = await getMenu(options);
  return loaded.categories.some((category) => category.id === value);
}

export async function getItemsByCategoryAsync(
  categoryId: CategoryId,
  options: { noStore?: boolean; failClosed?: boolean } = {},
): Promise<MenuItem[]> {
  const loaded = await getMenu(options);
  const mainItems = loaded.items.filter(
    (item) => item.categoryId === categoryId && !item.isAddOnItem,
  );
  const addOnItems = loaded.items.filter(
    (item) => item.categoryId === categoryId && item.isAddOnItem === true,
  );
  return [...mainItems, ...addOnItems];
}

export async function getCategoryStartingPriceAsync(
  categoryId: CategoryId,
  options: { noStore?: boolean; failClosed?: boolean } = {},
): Promise<number> {
  const loaded = await getMenu(options);
  const prices = loaded.items
    .filter((item) => item.categoryId === categoryId && !item.isAddOnItem)
    .map((item) => item.basePrice);

  if (prices.length === 0) {
    throw new Error("Kategori menu tidak memiliki produk utama.");
  }

  return Math.min(...prices);
}

// ---------------------------------------------------------------------
// Admin read — service role (bypass RLS), termasuk item/kategori arsip.
// Tidak di-cache (admin butuh data segar). Mengembalikan null bila DB
// belum dikonfigurasi (pemanggil menangani mode FITUR_BELUM_AKTIF).
// ---------------------------------------------------------------------
export interface AdminMenu {
  categories: MenuCategory[];
  items: MenuItem[];
  addOns: MenuAddOn[];
  source: "db" | "fallback";
}

export type AdminMenuResult =
  | { ok: true; menu: AdminMenu }
  | { ok: false; reason: "not-configured" }
  | { ok: false; reason: "migration-pending" };

// PostgREST mengembalikan kode 42P01 / pesan "Could not find the table" bila
// tabel belum dibuat (migration belum dijalankan). Dipakai untuk membedakan
// dari kegagalan tak terduga agar pesan admin lebih akurat.
function isTableMissingError(
  ...errors: Array<{ message?: string; code?: string } | null | undefined>
): boolean {
  return errors.some(
    (error) =>
      error !== null &&
      error !== undefined &&
      (error.code === "42P01" ||
        (typeof error.message === "string" &&
          error.message.includes("Could not find the table"))),
  );
}

export async function getAdminMenu(): Promise<AdminMenuResult> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured" };
  }

  const [catRes, itemRes, addOnRes] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id,name,tagline,image,sort_order,archived,updated_at")
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(ITEM_SELECT)
      .order("sort_order", { ascending: true }),
    supabase.from("menu_addons").select("id,name,price").order("name", { ascending: true }),
  ]);

  if (catRes.error || itemRes.error || addOnRes.error) {
    if (isTableMissingError(catRes.error, itemRes.error, addOnRes.error)) {
      return { ok: false, reason: "migration-pending" };
    }
    console.error(
      "[menu-data:getAdminMenu]",
      catRes.error?.message,
      itemRes.error?.message,
      addOnRes.error?.message,
    );
    return { ok: false, reason: "migration-pending" };
  }

  const categoryRows = (catRes.data ?? []) as unknown as Array<
    CategoryRow & { archived: boolean }
  >;
  const itemRows = (itemRes.data ?? []) as unknown as Array<
    ItemRow & { archived: boolean }
  >;
  const addOnRows = (addOnRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    price: number;
  }>;

  return {
    ok: true,
    menu: {
      categories: categoryRows.map((row) => ({
        id: row.id,
        name: row.name,
        tagline: row.tagline ?? "",
        image: row.image ?? "",
        order: row.sort_order,
        ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
      })),
      items: itemRows.map(rowToItem),
      addOns: addOnRows.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: addon.price,
      })),
      source: "db",
    },
  };
}

export async function getAdminAddOns(): Promise<MenuAddOn[] | null> {
  const supabase = await getAuthorizedAdminServiceClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from("menu_addons")
    .select("id,name,price")
    .order("name", { ascending: true });
  if (error) {
    console.error("[menu-data:getAdminAddOns]", error.message);
    return null;
  }
  return (data ?? []).map((addon) => ({
    id: addon.id as string,
    name: addon.name as string,
    price: addon.price as number,
  }));
}
