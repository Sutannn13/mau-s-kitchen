import {
  MenuManager,
  type ManagedAddOn,
  type ManagedCategory,
  type ManagedItem,
} from "@/components/admin/MenuManager";
import { formatRupiah } from "@/lib/format";
import { getAdminMenu } from "@/lib/menu-data";

// Kelola menu (CRUD kategori + item + varian + add-on + urutan + arsip).
// docs/14_ADMIN_DASHBOARD.md §14.4 & docs/11_API_SPEC.md §11.8.
export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const result = await getAdminMenu();

  if (!result.ok) {
    const heading = "Kelola Menu";
    const message =
      result.reason === "migration-pending"
        ? "Tabel menu belum dibuat di database. Jalankan file supabase/migrations/20260817_menu_crud.sql di Supabase SQL Editor (dashboard → SQL Editor → paste → Run) untuk membuat tabel menu, RLS, dan seed data."
        : "Database belum dikonfigurasi. Ikuti petunjuk di docs/19_SETUP_MANUAL.md untuk mengaktifkan kelola menu mandiri.";
    return (
      <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
            {heading}
          </h1>
          <p className="mt-3 rounded-2xl border border-gold/20 bg-cream-soft p-4 text-sm leading-6 text-brown/75">
            {message}
          </p>
        </div>
      </main>
    );
  }

  const menu = result.menu;
  const categories: ManagedCategory[] = [...menu.categories].sort(
    (a, b) => a.order - b.order,
  );
  const items: ManagedItem[] = menu.items.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    basePrice: item.basePrice,
    priceLabel:
      item.variants.length > 0
        ? item.variants.map((variant) => formatRupiah(variant.price)).join(" / ")
        : formatRupiah(item.basePrice),
    image: item.image,
    available: item.available,
    isBestSeller: item.isBestSeller,
    isAddOnItem: item.isAddOnItem === true,
    unit: item.unit,
    sortOrder: item.sortOrder ?? 0,
    archived: false,
    variants: item.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      sortOrder: variant.sortOrder ?? 0,
    })),
    addOnIds: item.addOns.map((addOn) => addOn.id),
  }));
  const addOns: ManagedAddOn[] = menu.addOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    price: addOn.price,
  }));

  return (
    <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
          Kelola Menu
        </h1>
        <p className="mt-2 text-sm leading-6 text-brown/75">
          Tambah, ubah, atau arsip menu dari dasbor. Perubahan tampil ke
          pelanggan maksimal 60 detik.
        </p>
        <div className="mt-4">
          <MenuManager categories={categories} items={items} addOns={addOns} />
        </div>
      </div>
    </main>
  );
}
