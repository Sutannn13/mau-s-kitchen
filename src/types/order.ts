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
export type DeliveryProvider = "internal" | "gosend" | "grabexpress" | "other";
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
  publicToken: string;
  createdAt: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number | null;
  deliveryProvider: DeliveryProvider | null;
  courierCost: number | null;
  total: number;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  /**
   * Waktu pelanggan menyatakan sudah membayar (ISO). Ini klaim pelanggan,
   * bukan verifikasi admin — status pesanan tetap BARU sampai admin
   * mengonfirmasi (docs/04_BUSINESS_FLOW.md §4.3).
   */
  paymentClaimedAt?: string;
  status: OrderStatus;
  adminNote?: string;
  updatedAt: string;
}
