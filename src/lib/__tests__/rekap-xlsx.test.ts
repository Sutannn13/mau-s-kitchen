import { describe, expect, it } from "vitest";

import type { RekapData } from "@/lib/admin/orders";
import { buildRekapWorkbook, rekapToXlsx } from "@/lib/rekap-xlsx";

const rekap: RekapData = {
  dari: "2026-08-28",
  sampai: "2026-08-28",
  totalPesanan: 2,
  pesananSelesai: 1,
  pesananBatal: 0,
  omzet: 35_000,
  rataRataTransaksi: 35_000,
  itemTerlaris: [{ itemId: "menu-1", name: "Sate Taichan", qty: 2 }],
  perMetodeBayar: { qris: 0, transfer: 0, tunai: 2 },
  orders: [
    {
      code: "MK-260828-001",
      publicToken: "token-1",
      createdAt: "2026-08-28T04:49:45.611Z",
      customer: {
        name: '=HYPERLINK("https://example.invalid","uji")',
        whatsapp: "628123456789",
        orderType: "ambil",
      },
      items: [
        {
          lineId: "line-1",
          itemId: "menu-1",
          name: "Sate Taichan",
          image: "/menu.jpg",
          variantId: null,
          variantName: null,
          unitPrice: 17_500,
          addOns: [],
          quantity: 2,
        },
      ],
      subtotal: 35_000,
      deliveryFee: null,
      deliveryProvider: null,
      courierCost: null,
      total: 35_000,
      paymentMethod: "tunai",
      status: "BARU",
      updatedAt: "2026-08-28T04:49:45.611Z",
    },
    {
      code: "MK-260828-002",
      publicToken: "token-2",
      createdAt: "2026-08-28T06:27:26.545Z",
      customer: {
        name: "Pelanggan Selesai",
        whatsapp: "628123456780",
        orderType: "antar",
        address: "Alamat uji",
      },
      items: [],
      subtotal: 30_000,
      deliveryFee: 5_000,
      deliveryProvider: "internal",
      courierCost: 0,
      total: 35_000,
      paymentMethod: "tunai",
      status: "SELESAI",
      updatedAt: "2026-08-28T06:27:26.545Z",
    },
  ],
};

describe("rekap Excel", () => {
  it("membuat ringkasan formula dan tabel detail bertipe angka", () => {
    const workbook = buildRekapWorkbook(rekap);
    const summary = workbook.getWorksheet("Ringkasan");
    const orders = workbook.getWorksheet("Pesanan");
    const items = workbook.getWorksheet("Item Pesanan");

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Pesanan",
      "Item Pesanan",
      "Ringkasan",
    ]);
    expect(summary?.getCell("A7").value).toMatchObject({
      formula: "COUNTA('Pesanan'!$A$2:$A$3)",
      result: 2,
    });
    expect(summary?.getCell("G7").value).toMatchObject({ result: 35_000 });
    expect(orders?.getCell("F2").value).toBe(35_000);
    expect(orders?.getCell("B2").value).toEqual(
      new Date("2026-08-28T11:49:45.000Z"),
    );
    expect(orders?.getCell("C2").value).toBe(
      '=HYPERLINK("https://example.invalid","uji")',
    );
    expect(orders?.getCell("H2").value).toBeNull();
    expect(orders?.getCell("J3").value).toMatchObject({ result: 5_000 });
    expect(orders?.getCell("L3").value).toMatchObject({
      formula: 'K3-(F3+IF(G3="",0,G3))',
    });
    expect(items?.getCell("J2").value).toMatchObject({ result: 35_000 });
    expect(summary?.getCell("G16").border).toMatchObject({
      top: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
    });
    expect(summary?.getCell("G16").alignment).toMatchObject({
      horizontal: "center",
      vertical: "middle",
    });
    expect(summary?.getCell("F16").alignment).toMatchObject({
      horizontal: "left",
      vertical: "middle",
    });
    expect(JSON.stringify(workbook.model)).not.toContain("token-1");
  });

  it("menghasilkan berkas XLSX valid", async () => {
    const output = await rekapToXlsx(rekap);
    const signature = new TextDecoder().decode(output.slice(0, 2));

    expect(signature).toBe("PK");
    expect(output.byteLength).toBeGreaterThan(10_000);
  });

  it("tetap valid ketika periode tidak memiliki pesanan", async () => {
    const emptyRekap: RekapData = {
      ...rekap,
      totalPesanan: 0,
      pesananSelesai: 0,
      omzet: 0,
      rataRataTransaksi: 0,
      itemTerlaris: [],
      perMetodeBayar: { qris: 0, transfer: 0, tunai: 0 },
      orders: [],
    };

    const output = await rekapToXlsx(emptyRekap);

    expect(output.byteLength).toBeGreaterThan(10_000);
  });
});
