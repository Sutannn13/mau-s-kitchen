import { MenuManager, type ManagedMenuItem } from "@/components/admin/MenuManager";
import { formatRupiah } from "@/lib/format";
import { menu } from "@/lib/menu";
import { getFreshAvailabilityOverrides } from "@/lib/menu-availability";

// Kelola ketersediaan menu (docs/14 §14.4). Admin butuh status segar,
// bukan cache ISR 60 detik.
export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const overrides = await getFreshAvailabilityOverrides();

  const groups = [...menu.categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      categoryName: category.name,
      items: menu.items
        .filter((item) => item.categoryId === category.id)
        .map(
          (item): ManagedMenuItem => ({
            id: item.id,
            name: item.name + (item.isAddOnItem ? " (tambahan)" : ""),
            priceLabel:
              item.variants.length > 0
                ? item.variants
                    .map((variant) => formatRupiah(variant.price))
                    .join(" / ")
                : formatRupiah(item.basePrice),
            initialAvailable: overrides.get(item.id) ?? item.available,
          }),
        ),
    }));

  return (
    <main className="mx-auto w-full max-w-content px-4 pt-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-2xl font-bold text-brown-deep md:text-3xl">
          Kelola Menu
        </h1>
        <p className="mt-2 text-sm leading-6 text-brown/75">
          Nyalakan untuk menjual, matikan saat habis. Item yang ditandai habis
          tampil abu-abu dan tidak bisa dipesan pelanggan.
        </p>
        <div className="mt-4">
          <MenuManager groups={groups} />
        </div>
      </div>
    </main>
  );
}
