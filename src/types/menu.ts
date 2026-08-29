// CategoryId sekarang dinamis (admin bisa buat kategori baru lewat dashboard).
// Tetap di-export sebagai alias string agar kode lama tetap kompilasi, namun
// tidak lagi membatasi nilai literal. Lihat docs/10_DATA_MODEL.md §10.3.
export type CategoryId = string;

export interface MenuCategory {
  id: CategoryId;
  name: string;
  tagline: string;
  image: string;
  order: number;
  updatedAt?: string;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  sortOrder?: number;
}

export interface MenuAddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  basePrice: number;
  variants: MenuVariant[];
  addOns: MenuAddOn[];
  image: string;
  available: boolean;
  isBestSeller: boolean;
  isAddOnItem?: boolean;
  unit: "porsi" | "cup" | "item";
  sortOrder?: number;
  updatedAt?: string;
}

// Hasil pilihan pengguna dari ProductSheet; akan dipakai store keranjang (T3.1).
export interface ProductSelection {
  variant: MenuVariant | null;
  addOns: MenuAddOn[];
  quantity: number;
  note: string;
}

export interface MenuData {
  version: string;
  updatedAt: string;
  currency: "IDR";
  brand: {
    name: string;
    tagline: string;
    whatsapp: string;
    whatsappDisplay: string;
  };
  categories: MenuCategory[];
  items: MenuItem[];
  archivedItems: {
    id: string;
    name: string;
    reason: string;
  }[];
}
