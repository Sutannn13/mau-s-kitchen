import ExcelJS from "exceljs";

import type { RekapData } from "@/lib/admin/orders";
import {
  calculateDeliveryMargin,
  deliveryProviderLabels,
} from "@/lib/order-delivery";
import type { OrderStatus, PaymentMethod } from "@/types/order";

const BRAND = {
  brown: "FF3E2318",
  brownSoft: "FF5C3A24",
  cream: "FFF7EEE4",
  creamSoft: "FFFBF6F0",
  gold: "FFC79A4B",
  goldLight: "FFE3C489",
  white: "FFFFFFFF",
  green: "FF2E7D32",
  red: "FFC53030",
} as const;

const CURRENCY_FORMAT = '"Rp"#,##0;[Red]-"Rp"#,##0;"Rp"0';
const INTEGER_FORMAT = "#,##0";
const DATE_TIME_FORMAT = "dd mmm yyyy hh:mm";

const statusLabels: Record<OrderStatus, string> = {
  BARU: "Baru",
  DIKONFIRMASI: "Dikonfirmasi",
  DIPROSES: "Diproses",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  BATAL: "Batal",
};

const paymentLabels: Record<PaymentMethod, string> = {
  qris: "QRIS",
  transfer: "Transfer Bank",
  tunai: "Tunai / COD",
};

const statusFillColors: Record<OrderStatus, string> = {
  BARU: "FFFFF2CC",
  DIKONFIRMASI: "FFDDEBF7",
  DIPROSES: "FFE4DFEC",
  DIKIRIM: "FFD9EAD3",
  SELESAI: "FFE2F0D9",
  BATAL: "FFF4CCCC",
};

function solidFill(argb: string): ExcelJS.FillPattern {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function thinBorder(color: string = BRAND.goldLight): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = {
    style: "thin",
    color: { argb: color },
  };
  return { top: side, right: side, bottom: side, left: side };
}

function forEachCell(
  sheet: ExcelJS.Worksheet,
  firstRow: number,
  lastRow: number,
  firstColumn: number,
  lastColumn: number,
  callback: (cell: ExcelJS.Cell) => void,
): void {
  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      callback(sheet.getCell(row, column));
    }
  }
}

function jakartaWallTime(isoDate: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoDate));
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  // Excel menyimpan tanggal tanpa zona waktu; UTC dipakai untuk mengunci wall time WIB.
  return new Date(
    Date.UTC(
      Number(value.year),
      Number(value.month) - 1,
      Number(value.day),
      Number(value.hour),
      Number(value.minute),
      Number(value.second),
    ),
  );
}

function styleTableHeader(row: ExcelJS.Row): void {
  row.height = 30;
  row.eachCell((cell) => {
    cell.fill = solidFill(BRAND.brown);
    cell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: BRAND.white },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = thinBorder(BRAND.brown);
  });
}

function styleDataRows(
  sheet: ExcelJS.Worksheet,
  firstRow: number,
  lastRow: number,
): void {
  if (lastRow < firstRow) return;

  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.height = 24;
    row.eachCell((cell) => {
      cell.font = {
        name: "Aptos",
        size: 10,
        color: { argb: BRAND.brown },
      };
      cell.alignment = { vertical: "middle", wrapText: false };
    });
  }
}

function applyPageSetup(sheet: ExcelJS.Worksheet): void {
  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };
  sheet.headerFooter.oddFooter =
    "&LMAU'S Kitchen&CPage &P dari &N&RInternal Admin";
}

function buildOrdersSheet(
  workbook: ExcelJS.Workbook,
  rekap: RekapData,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet("Pesanan", {
    views: [
      {
        state: "frozen",
        xSplit: 2,
        ySplit: 1,
        activeCell: "C2",
        showGridLines: false,
      },
    ],
  });
  applyPageSetup(sheet);

  const rows = rekap.orders.map((order, index) => {
    const rowNumber = index + 2;
    const deliveryMargin = calculateDeliveryMargin(
      order.deliveryFee,
      order.courierCost,
    );
    const expectedTotal = order.subtotal + (order.deliveryFee ?? 0);

    return [
      order.code,
      jakartaWallTime(order.createdAt),
      order.customer.name,
      statusLabels[order.status],
      paymentLabels[order.paymentMethod],
      order.subtotal,
      order.deliveryFee,
      order.deliveryProvider
        ? deliveryProviderLabels[order.deliveryProvider]
        : null,
      order.courierCost,
      {
        formula: `IF(OR(G${rowNumber}="",I${rowNumber}=""),"",G${rowNumber}-I${rowNumber})`,
        result: deliveryMargin ?? "",
      },
      order.total,
      {
        formula: `K${rowNumber}-(F${rowNumber}+IF(G${rowNumber}="",0,G${rowNumber}))`,
        result: order.total - expectedTotal,
      },
    ];
  });

  sheet.addTable({
    name: "TabelPesanan",
    ref: "A1",
    headerRow: true,
    totalsRow: rows.length > 0,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: [
      { name: "Kode Pesanan", totalsRowLabel: "TOTAL" },
      { name: "Tanggal (WIB)" },
      { name: "Nama Pelanggan" },
      { name: "Status" },
      { name: "Metode Pembayaran" },
      { name: "Subtotal", totalsRowFunction: "sum" },
      { name: "Ongkir Pelanggan", totalsRowFunction: "sum" },
      { name: "Pengantar" },
      { name: "Biaya Kurir Aktual", totalsRowFunction: "sum" },
      { name: "Selisih Ongkir", totalsRowFunction: "sum" },
      { name: "Total Pesanan", totalsRowFunction: "sum" },
      { name: "Cek Total", totalsRowFunction: "sum" },
    ],
    rows,
  });

  styleTableHeader(sheet.getRow(1));
  styleDataRows(sheet, 2, rows.length + 1);
  sheet.columns = [
    { key: "code", width: 19 },
    { key: "date", width: 22 },
    { key: "customer", width: 27 },
    { key: "status", width: 17 },
    { key: "payment", width: 21 },
    { key: "subtotal", width: 17 },
    { key: "deliveryFee", width: 18 },
    { key: "provider", width: 24 },
    { key: "courierCost", width: 19 },
    { key: "margin", width: 18 },
    { key: "total", width: 18 },
    { key: "check", width: 14 },
  ];
  sheet.getColumn(2).numFmt = DATE_TIME_FORMAT;
  for (const column of [6, 7, 9, 10, 11, 12]) {
    sheet.getColumn(column).numFmt = CURRENCY_FORMAT;
    sheet.getColumn(column).alignment = {
      horizontal: "right",
      vertical: "middle",
    };
  }

  rekap.orders.forEach((order, index) => {
    const statusCell = sheet.getCell(index + 2, 4);
    statusCell.fill = solidFill(statusFillColors[order.status]);
    statusCell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: BRAND.brown },
    };
    statusCell.alignment = { horizontal: "center", vertical: "middle" };

    const checkCell = sheet.getCell(index + 2, 12);
    const checkValue =
      order.total - (order.subtotal + (order.deliveryFee ?? 0));
    checkCell.fill = solidFill(checkValue === 0 ? "FFE2F0D9" : "FFF4CCCC");
    checkCell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: checkValue === 0 ? BRAND.green : BRAND.red },
    };
  });

  if (rows.length > 0) {
    const totalsRow = sheet.getRow(rows.length + 2);
    totalsRow.height = 26;
    totalsRow.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: BRAND.brown },
    };
    for (const column of [6, 7, 9, 10, 11, 12]) {
      totalsRow.getCell(column).numFmt = CURRENCY_FORMAT;
    }
  }

  return sheet;
}

function buildItemsSheet(
  workbook: ExcelJS.Workbook,
  rekap: RekapData,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet("Item Pesanan", {
    views: [
      {
        state: "frozen",
        xSplit: 1,
        ySplit: 1,
        activeCell: "B2",
        showGridLines: false,
      },
    ],
  });
  applyPageSetup(sheet);

  let rowNumber = 2;
  const rows = rekap.orders.flatMap((order) =>
    order.items.map((item) => {
      const addOnTotal = item.addOns.reduce(
        (total, addOn) => total + addOn.price,
        0,
      );
      const unitTotal = item.unitPrice + addOnTotal;
      const currentRow = rowNumber;
      rowNumber += 1;

      return [
        order.code,
        item.itemId,
        item.name,
        item.variantName ?? "-",
        item.addOns.length > 0
          ? item.addOns.map((addOn) => addOn.name).join(", ")
          : "-",
        item.unitPrice,
        addOnTotal,
        { formula: `F${currentRow}+G${currentRow}`, result: unitTotal },
        item.quantity,
        {
          formula: `H${currentRow}*I${currentRow}`,
          result: unitTotal * item.quantity,
        },
        statusLabels[order.status],
      ];
    }),
  );

  sheet.addTable({
    name: "TabelItemPesanan",
    ref: "A1",
    headerRow: true,
    totalsRow: rows.length > 0,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: [
      { name: "Kode Pesanan", totalsRowLabel: "TOTAL" },
      { name: "ID Menu" },
      { name: "Nama Menu" },
      { name: "Varian" },
      { name: "Add-on" },
      { name: "Harga Menu", totalsRowFunction: "sum" },
      { name: "Total Add-on", totalsRowFunction: "sum" },
      { name: "Harga Satuan" },
      { name: "Jumlah", totalsRowFunction: "sum" },
      { name: "Total Baris", totalsRowFunction: "sum" },
      { name: "Status Pesanan" },
    ],
    rows,
  });

  styleTableHeader(sheet.getRow(1));
  styleDataRows(sheet, 2, rows.length + 1);
  sheet.columns = [
    { key: "code", width: 19 },
    { key: "itemId", width: 20 },
    { key: "name", width: 28 },
    { key: "variant", width: 20 },
    { key: "addons", width: 30 },
    { key: "menuPrice", width: 16 },
    { key: "addonTotal", width: 16 },
    { key: "unitTotal", width: 16 },
    { key: "quantity", width: 12 },
    { key: "lineTotal", width: 17 },
    { key: "status", width: 17 },
  ];
  for (const column of [6, 7, 8, 10]) {
    sheet.getColumn(column).numFmt = CURRENCY_FORMAT;
    sheet.getColumn(column).alignment = {
      horizontal: "right",
      vertical: "middle",
    };
  }
  sheet.getColumn(9).numFmt = INTEGER_FORMAT;

  if (rows.length > 0) {
    const totalsRow = sheet.getRow(rows.length + 2);
    totalsRow.height = 26;
    totalsRow.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: BRAND.brown },
    };
    for (const column of [6, 7, 8, 10]) {
      totalsRow.getCell(column).numFmt = CURRENCY_FORMAT;
    }
    totalsRow.getCell(9).numFmt = INTEGER_FORMAT;
  }

  return sheet;
}

function applyCard(
  sheet: ExcelJS.Worksheet,
  labelRange: string,
  valueRange: string,
  label: string,
  formula: string,
  result: number,
  numberFormat: string,
): void {
  sheet.mergeCells(labelRange);
  sheet.mergeCells(valueRange);
  const labelCell = sheet.getCell(labelRange.split(":")[0]!);
  const valueCell = sheet.getCell(valueRange.split(":")[0]!);

  labelCell.value = label;
  labelCell.fill = solidFill(BRAND.goldLight);
  labelCell.font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: { argb: BRAND.brown },
  };
  labelCell.alignment = { vertical: "middle", horizontal: "center" };
  labelCell.border = thinBorder();

  valueCell.value = { formula, result };
  valueCell.fill = solidFill(BRAND.creamSoft);
  valueCell.font = {
    name: "Georgia",
    size: 20,
    bold: true,
    color: { argb: BRAND.brown },
  };
  valueCell.alignment = { vertical: "middle", horizontal: "center" };
  valueCell.border = thinBorder();
  valueCell.numFmt = numberFormat;
}

function buildSummarySheet(
  workbook: ExcelJS.Workbook,
  rekap: RekapData,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet("Ringkasan", {
    views: [{ state: "normal", showGridLines: false }],
  });
  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.45,
      bottom: 0.45,
      header: 0.2,
      footer: 0.2,
    },
  };
  sheet.headerFooter.oddFooter =
    "&LMAU'S Kitchen&CPage &P dari &N&RInternal Admin";
  sheet.columns = Array.from({ length: 8 }, () => ({ width: 16 }));

  sheet.mergeCells("A1:H2");
  const title = sheet.getCell("A1");
  title.value = "MAU'S KITCHEN — REKAP PENJUALAN";
  title.fill = solidFill(BRAND.brown);
  title.font = {
    name: "Georgia",
    size: 22,
    bold: true,
    color: { argb: BRAND.cream },
  };
  title.alignment = { vertical: "middle", horizontal: "center" };
  title.border = thinBorder(BRAND.brown);
  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 30;

  sheet.mergeCells("A3:H3");
  const period = sheet.getCell("A3");
  period.value = `Periode ${rekap.dari} s.d. ${rekap.sampai}`;
  period.fill = solidFill(BRAND.gold);
  period.font = {
    name: "Aptos",
    size: 11,
    bold: true,
    color: { argb: BRAND.brown },
  };
  period.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(3).height = 24;

  sheet.mergeCells("A4:H4");
  const policy = sheet.getCell("A4");
  policy.value =
    "Zona waktu Asia/Jakarta · Omzet hanya menghitung pesanan berstatus Selesai · Nominal dalam Rupiah";
  policy.font = {
    name: "Aptos",
    size: 9,
    italic: true,
    color: { argb: BRAND.brownSoft },
  };
  policy.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(4).height = 22;

  const orderLastRow = Math.max(2, rekap.orders.length + 1);
  const itemCount = rekap.orders.reduce(
    (count, order) => count + order.items.length,
    0,
  );
  const itemLastRow = Math.max(2, itemCount + 1);
  const statusRange = `'Pesanan'!$D$2:$D$${orderLastRow}`;
  const paymentRange = `'Pesanan'!$E$2:$E$${orderLastRow}`;
  const totalRange = `'Pesanan'!$K$2:$K$${orderLastRow}`;
  const checkRange = `'Pesanan'!$L$2:$L$${orderLastRow}`;

  applyCard(
    sheet,
    "A6:B6",
    "A7:B8",
    "Total Pesanan",
    `COUNTA('Pesanan'!$A$2:$A$${orderLastRow})`,
    rekap.totalPesanan,
    INTEGER_FORMAT,
  );
  applyCard(
    sheet,
    "C6:D6",
    "C7:D8",
    "Pesanan Selesai",
    `COUNTIF(${statusRange},"Selesai")`,
    rekap.pesananSelesai,
    INTEGER_FORMAT,
  );
  applyCard(
    sheet,
    "E6:F6",
    "E7:F8",
    "Pesanan Batal",
    `COUNTIF(${statusRange},"Batal")`,
    rekap.pesananBatal,
    INTEGER_FORMAT,
  );
  applyCard(
    sheet,
    "G6:H6",
    "G7:H8",
    "Omzet (Selesai)",
    `SUMIF(${statusRange},"Selesai",${totalRange})`,
    rekap.omzet,
    CURRENCY_FORMAT,
  );
  applyCard(
    sheet,
    "A10:D10",
    "A11:D12",
    "Rata-rata per Transaksi Selesai",
    `IFERROR(AVERAGEIF(${statusRange},"Selesai",${totalRange}),0)`,
    rekap.rataRataTransaksi,
    CURRENCY_FORMAT,
  );
  applyCard(
    sheet,
    "E10:H10",
    "E11:H12",
    "Tingkat Penyelesaian",
    "IFERROR(C7/A7,0)",
    rekap.totalPesanan > 0 ? rekap.pesananSelesai / rekap.totalPesanan : 0,
    "0%",
  );

  sheet.mergeCells("A14:D14");
  sheet.getCell("A14").value = "METODE PEMBAYARAN";
  sheet.mergeCells("E14:H14");
  sheet.getCell("E14").value = "MENU PALING BANYAK DIPESAN";
  for (const cellAddress of ["A14", "E14"]) {
    const cell = sheet.getCell(cellAddress);
    cell.fill = solidFill(BRAND.brown);
    cell.font = {
      name: "Aptos",
      size: 11,
      bold: true,
      color: { argb: BRAND.white },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = thinBorder(BRAND.brown);
  }
  sheet.getRow(14).height = 26;

  const summaryHeaders = [
    "Metode",
    "Jumlah",
    "Porsi",
    "Catatan",
    "Peringkat",
    "Menu",
    "Jumlah",
    "Catatan",
  ];
  summaryHeaders.forEach((value, index) => {
    sheet.getCell(15, index + 1).value = value;
  });
  forEachCell(sheet, 15, 15, 1, 8, (cell) => {
    cell.fill = solidFill(BRAND.goldLight);
    cell.font = {
      name: "Aptos",
      size: 9,
      bold: true,
      color: { argb: BRAND.brown },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thinBorder();
  });

  const paymentRows: Array<[PaymentMethod, string]> = [
    ["qris", "QRIS"],
    ["transfer", "Transfer Bank"],
    ["tunai", "Tunai / COD"],
  ];
  paymentRows.forEach(([method, label], index) => {
    const currentRow = index + 16;
    const count = rekap.perMetodeBayar[method];
    sheet.getCell(currentRow, 1).value = label;
    sheet.getCell(currentRow, 2).value = {
      formula: `COUNTIF(${paymentRange},"${label}")`,
      result: count,
    };
    sheet.getCell(currentRow, 3).value = {
      formula: `IFERROR(B${currentRow}/$A$7,0)`,
      result: rekap.totalPesanan > 0 ? count / rekap.totalPesanan : 0,
    };
    sheet.getCell(currentRow, 4).value = "Semua status";
  });

  const displayedItems = rekap.itemTerlaris.slice(0, 5);
  for (let index = 0; index < 5; index += 1) {
    const currentRow = index + 16;
    const item = displayedItems[index];
    sheet.getCell(currentRow, 5).value = index + 1;
    sheet.getCell(currentRow, 6).value = item?.name ?? "-";
    sheet.getCell(currentRow, 7).value = item
      ? {
          formula: `SUMIF('Item Pesanan'!$C$2:$C$${itemLastRow},F${currentRow},'Item Pesanan'!$I$2:$I$${itemLastRow})`,
          result: item.qty,
        }
      : 0;
    sheet.getCell(currentRow, 8).value = "Semua status";
  }

  for (let currentRow = 16; currentRow <= 20; currentRow += 1) {
    forEachCell(sheet, currentRow, currentRow, 1, 8, (cell) => {
      cell.fill = solidFill(
        currentRow % 2 === 0 ? BRAND.creamSoft : BRAND.cream,
      );
      cell.font = {
        name: "Aptos",
        size: 9,
        color: { argb: BRAND.brown },
      };
      cell.alignment = { vertical: "middle", wrapText: false };
      cell.border = thinBorder();
    });

    for (const column of [2, 3, 5, 7]) {
      sheet.getCell(currentRow, column).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    for (const column of [1, 4, 6, 8]) {
      sheet.getCell(currentRow, column).alignment = {
        horizontal: "left",
        vertical: "middle",
      };
    }

    sheet.getCell(currentRow, 2).numFmt = INTEGER_FORMAT;
    sheet.getCell(currentRow, 3).numFmt = "0%";
    sheet.getCell(currentRow, 7).numFmt = INTEGER_FORMAT;
    sheet.getRow(currentRow).height = 23;
  }

  sheet.mergeCells("A22:H22");
  const checkTitle = sheet.getCell("A22");
  checkTitle.value = "PEMERIKSAAN DATA";
  checkTitle.fill = solidFill(BRAND.brown);
  checkTitle.font = {
    name: "Aptos",
    size: 11,
    bold: true,
    color: { argb: BRAND.white },
  };
  checkTitle.alignment = { horizontal: "center", vertical: "middle" };

  const inconsistentOrders = rekap.orders.filter(
    (order) => order.total !== order.subtotal + (order.deliveryFee ?? 0),
  ).length;
  sheet.mergeCells("A23:F23");
  sheet.getCell("A23").value =
    "Pesanan dengan selisih total (harus 0 agar laporan konsisten)";
  sheet.getCell("G23").value = {
    formula: `COUNTIF(${checkRange},"<>0")`,
    result: inconsistentOrders,
  };
  sheet.getCell("H23").value = "pesanan";
  forEachCell(sheet, 23, 23, 1, 8, (cell) => {
    cell.fill = solidFill(BRAND.creamSoft);
    cell.font = {
      name: "Aptos",
      size: 9,
      color: { argb: BRAND.brown },
    };
    cell.border = thinBorder();
  });
  sheet.getCell("G23").numFmt = INTEGER_FORMAT;
  sheet.getCell("G23").font = {
    name: "Aptos",
    size: 11,
    bold: true,
    color: {
      argb: inconsistentOrders === 0 ? BRAND.green : BRAND.red,
    },
  };

  sheet.mergeCells("A25:H27");
  const note = sheet.getCell("A25");
  note.value =
    "Cara pakai: gunakan filter pada sheet Pesanan atau Item Pesanan untuk memeriksa transaksi. Sel ringkasan memakai rumus dan akan dihitung ulang saat file dibuka di Excel. Biaya kurir aktual dan selisih ongkir adalah data internal admin.";
  note.fill = solidFill(BRAND.cream);
  note.font = {
    name: "Aptos",
    size: 9,
    italic: true,
    color: { argb: BRAND.brownSoft },
  };
  note.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  note.border = thinBorder();

  sheet.getColumn(1).width = 21;
  sheet.getColumn(2).width = 16;
  sheet.getColumn(3).width = 14;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 28;
  sheet.getColumn(7).width = 14;
  sheet.getColumn(8).width = 18;
  sheet.getRow(23).height = 24;
  sheet.getRow(25).height = 24;
  sheet.getRow(26).height = 24;
  sheet.getRow(27).height = 24;

  return sheet;
}

export function buildRekapWorkbook(rekap: RekapData): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MAU'S Kitchen";
  workbook.lastModifiedBy = "MAU'S Kitchen Admin";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `Rekap penjualan ${rekap.dari} s.d. ${rekap.sampai}`;
  workbook.title = "Rekap Penjualan MAU'S Kitchen";
  workbook.description =
    "Laporan internal admin. Omzet hanya menghitung pesanan selesai.";
  workbook.calcProperties.fullCalcOnLoad = true;

  // Detail dibangun lebih dulu agar semua rumus Ringkasan punya sumber jelas.
  buildOrdersSheet(workbook, rekap);
  buildItemsSheet(workbook, rekap);
  buildSummarySheet(workbook, rekap);
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 20_000,
      height: 12_000,
      firstSheet: 0,
      activeTab: 2,
      visibility: "visible",
    },
  ];

  return workbook;
}

export async function rekapToXlsx(rekap: RekapData): Promise<ArrayBuffer> {
  const workbook = buildRekapWorkbook(rekap);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer).slice().buffer;
}
