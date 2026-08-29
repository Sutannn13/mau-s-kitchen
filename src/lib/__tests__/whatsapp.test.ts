import { describe, expect, it } from "vitest";

import { formatRupiah } from "@/lib/format";
import {
  buildOrderMessage,
  buildPaymentConfirmationMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import type { Order } from "@/types/order";

const orderFixture: Order = {
  code: "MK-260814-007",
  publicToken: "a".repeat(43),
  createdAt: "2026-08-14T12:45:00.000Z",
  customer: {
    name: "Rizky",
    whatsapp: "6281234567890",
    orderType: "antar",
    address: "Jl. Melati No. 12, RT 03/RW 05",
    addressNote: "Pagar hijau",
    scheduledAt: undefined,
    note: "Sambelnya pisah ya",
  },
  items: [
    {
      lineId: "taichan-daging|-||",
      itemId: "taichan-daging",
      name: "Taichan Daging",
      image: "/assets/menu/menu-taichan.jpeg",
      variantId: null,
      variantName: null,
      unitPrice: 35000,
      addOns: [],
      quantity: 2,
    },
    {
      lineId: "choco-berry-grape|medium|pistacio-kunava|",
      itemId: "choco-berry-grape",
      name: "Choco Berry Grape",
      image: "/assets/menu/menu-chocoberry.jpeg",
      variantId: "medium",
      variantName: "Medium",
      unitPrice: 40000,
      addOns: [{ id: "pistacio-kunava", name: "Pistacio Kunava", price: 8000 }],
      quantity: 1,
      note: "coklat banyak",
    },
  ],
  subtotal: 118000,
  deliveryFee: null,
  deliveryProvider: null,
  courierCost: null,
  total: 118000,
  paymentMethod: "qris",
  status: "BARU",
  updatedAt: "2026-08-14T12:45:00.000Z",
};

describe("buildOrderMessage", () => {
  const message = buildOrderMessage(orderFixture);

  it("memuat kode, data pemesan, dan alamat", () => {
    expect(message).toContain("Kode Pesanan: *MK-260814-007*");
    expect(message).toContain("Nama    : Rizky");
    expect(message).toContain("WhatsApp: 6281234567890");
    expect(message).toContain("Tipe    : Antar");
    expect(message).toContain("Jl. Melati No. 12, RT 03/RW 05 (Pagar hijau)");
    expect(message).toContain("Waktu   : Secepatnya");
  });

  it("memuat rincian item dengan varian, add-on, dan subtotal baris", () => {
    expect(message).toContain("1. Taichan Daging");
    expect(message).toContain("2 × Rp35.000 = Rp70.000");
    expect(message).toContain("2. Choco Berry Grape (Medium)");
    expect(message).toContain("+ Pistacio Kunava");
    expect(message).toContain("1 × Rp48.000 = Rp48.000");
  });

  it("memuat total, ongkir, metode bayar, dan catatan", () => {
    expect(message).toContain("Subtotal : Rp118.000");
    expect(message).toContain("Ongkir   : dikonfirmasi admin");
    expect(message).toContain("Pengantar: dikonfirmasi admin");
    expect(message).toContain("*TOTAL SEMENTARA   : Rp118.000*");
    expect(message).toContain("Metode: QRIS (DANA / BCA / GoPay)");
    expect(message).toContain("Status: Menunggu ongkir sebelum pembayaran");
    expect(message).toContain("Sambelnya pisah ya");
  });

  it("menampilkan alamat ambil sendiri dan status COD", () => {
    const pickupMessage = buildOrderMessage({
      ...orderFixture,
      customer: { ...orderFixture.customer, orderType: "ambil", address: undefined },
      deliveryFee: 0,
      paymentMethod: "tunai",
    });

    expect(pickupMessage).toContain("Alamat  : — (Ambil Sendiri)");
    expect(pickupMessage).toContain("Status: Bayar di tempat");
  });
});

describe("buildPaymentConfirmationMessage", () => {
  it("memuat kode, total, dan metode", () => {
    const message = buildPaymentConfirmationMessage(orderFixture);

    expect(message).toContain("Kode Pesanan: *MK-260814-007*");
    expect(message).toContain(`Total: ${formatRupiah(118000)}`);
    expect(message).toContain("Metode: QRIS (DANA / BCA / GoPay)");
  });
});

describe("buildWhatsAppUrl", () => {
  it("mengenkode pesan pada deeplink wa.me", () => {
    const url = buildWhatsAppUrl("Halo MAU'S Kitchen\nBaris kedua");

    expect(url).toMatch(/^https:\/\/wa\.me\/62[0-9]+\?text=/);
    expect(url).toContain(encodeURIComponent("\n"));
  });
});
