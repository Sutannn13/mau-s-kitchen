import { siteConfig } from "@/config/site";
import { formatRupiah } from "@/lib/format";
import type { Order, PaymentMethod } from "@/types/order";

// Nomor WhatsApp selalu dari config (env); fallback sesuai docs/13 §13.1.
const WA_NUMBER = siteConfig.whatsappNumber || "6281617691585";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  qris: "QRIS (DANA / BCA / GoPay)",
  transfer: "Transfer Bank BCA",
  tunai: "Tunai / COD",
};

function formatJakarta(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    ...options,
  }).format(new Date(iso));
}

// Template resmi pesan pesanan. Lihat docs/13_WHATSAPP_INTEGRATION.md §13.2
// dan docs/04_BUSINESS_FLOW.md §4.6.
export function buildOrderMessage(order: Order): string {
  const tanggal = formatJakarta(order.createdAt, {
    dateStyle: "long",
    timeStyle: "short",
  });

  const items = order.items
    .map((item, index) => {
      const variant = item.variantName ? ` (${item.variantName})` : "";
      const addOns = item.addOns.length
        ? `\n   + ${item.addOns.map((addOn) => addOn.name).join(", ")}`
        : "";
      const note = item.note ? `\n   📝 ${item.note}` : "";
      const unit =
        item.unitPrice + item.addOns.reduce((total, addOn) => total + addOn.price, 0);
      const subtotal = unit * item.quantity;
      return `${index + 1}. ${item.name}${variant}${addOns}${note}\n   ${item.quantity} × ${formatRupiah(unit)} = ${formatRupiah(subtotal)}`;
    })
    .join("\n");

  const alamat =
    order.customer.orderType === "antar"
      ? `Alamat  : ${order.customer.address ?? "-"}${order.customer.addressNote ? ` (${order.customer.addressNote})` : ""}`
      : "Alamat  : — (Ambil Sendiri)";

  const ongkir =
    order.deliveryFee === null
      ? "Ongkir   : dikonfirmasi admin"
      : `Ongkir   : ${formatRupiah(order.deliveryFee)}`;

  const waktu = order.customer.scheduledAt
    ? formatJakarta(order.customer.scheduledAt, {
        dateStyle: "medium",
        timeStyle: "short",
      }) + " WIB"
    : "Secepatnya";

  return [
    "🍽️ *PESANAN BARU — MAU'S KITCHEN*",
    `Kode Pesanan: *${order.code}*`,
    `📅 ${tanggal} WIB`,
    "",
    "👤 *DATA PEMESAN*",
    `Nama    : ${order.customer.name}`,
    `WhatsApp: ${order.customer.whatsapp}`,
    `Tipe    : ${order.customer.orderType === "antar" ? "Antar" : "Ambil Sendiri"}`,
    alamat,
    `Waktu   : ${waktu}`,
    "",
    "🛒 *RINCIAN PESANAN*",
    items,
    "",
    `Subtotal : ${formatRupiah(order.subtotal)}`,
    ongkir,
    `*TOTAL   : ${formatRupiah(order.total)}*`,
    "",
    "💳 *PEMBAYARAN*",
    `Metode: ${paymentMethodLabels[order.paymentMethod]}`,
    `Status: ${order.paymentMethod === "tunai" ? "Bayar di tempat" : "Menunggu pembayaran"}`,
    ...(order.customer.note ? ["", "📝 *CATATAN*", order.customer.note] : []),
    "",
    "— Dikirim otomatis dari website MAU'S Kitchen",
  ].join("\n");
}

// Template konfirmasi sudah bayar dari halaman /pembayaran.
// Lihat docs/13_WHATSAPP_INTEGRATION.md §13.3.
export function buildPaymentConfirmationMessage(order: Order): string {
  return [
    "✅ *KONFIRMASI PEMBAYARAN*",
    `Kode Pesanan: *${order.code}*`,
    `Total: ${formatRupiah(order.total)}`,
    `Metode: ${paymentMethodLabels[order.paymentMethod]}`,
    "",
    "Halo admin, saya sudah melakukan pembayaran.",
    "Bukti transfer saya kirim setelah pesan ini ya 🙏",
  ].join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Template balasan admin ke pelanggan (docs/14_ADMIN_DASHBOARD.md §14.3).
// Estimasi dibiarkan "…" agar admin melengkapi sebelum mengirim.
export function buildAdminReplyMessage(order: Order): string {
  return [
    `Halo kak ${order.customer.name}`,
    `Pesanan *${order.code}* sudah kami terima.`,
    `Total: ${formatRupiah(order.total)} (termasuk ongkir ${formatRupiah(order.deliveryFee ?? 0)})`,
    "Estimasi siap: … menit.",
    "Terima kasih sudah pesan di MAU'S Kitchen",
  ].join("\n");
}

// Chat admin → pelanggan: nomor tujuan = WhatsApp pelanggan pada pesanan.
export function buildCustomerChatUrl(order: Order): string {
  const message = buildAdminReplyMessage(order);
  return `https://wa.me/${order.customer.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}
