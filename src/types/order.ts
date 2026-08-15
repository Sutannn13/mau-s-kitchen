import type { MenuAddOn } from "@/types/menu";

export interface CartItem {
  lineId: string;
  itemId: string;
  name: string;
  image: string;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  addOns: MenuAddOn[];
  note?: string;
  quantity: number;
}

export type OrderType = "antar" | "ambil";
export type PaymentMethod = "qris" | "transfer" | "tunai";
export type OrderStatus =
  | "BARU"
  | "DIKONFIRMASI"
  | "DIPROSES"
  | "DIKIRIM"
  | "SELESAI"
  | "BATAL";

export interface CustomerInfo {
  name: string;
  whatsapp: string;
  orderType: OrderType;
  address?: string;
  addressNote?: string;
  scheduledAt?: string;
  note?: string;
}

export interface Order {
  code: string;
  createdAt: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  status: OrderStatus;
  adminNote?: string;
  updatedAt: string;
}
