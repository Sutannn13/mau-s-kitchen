import { describe, expect, it } from "vitest";

import type { RekapData } from "@/lib/admin/orders";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { escapeCsvCell, rekapToCsv } from "@/lib/rekap-csv";

describe("CSV hardening", () => {
  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)"])(
    "menetralisasi formula %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("menghasilkan satu tabel tanpa blok ringkasan campuran", () => {
    const rekap = {
      dari: "2026-08-28",
      sampai: "2026-08-28",
      totalPesanan: 0,
      pesananSelesai: 0,
      pesananBatal: 0,
      omzet: 0,
      rataRataTransaksi: 0,
      itemTerlaris: [],
      perMetodeBayar: { qris: 0, transfer: 0, tunai: 0 },
      orders: [],
    } satisfies RekapData;

    expect(rekapToCsv(rekap)).toBe(
      '"Kode Pesanan","Tanggal (ISO)","Nama Pelanggan","Status","Metode Pembayaran","Subtotal","Ongkir Pelanggan","Pengantar","Biaya Kurir Aktual","Selisih Ongkir","Total Pesanan"',
    );
  });
});

describe("rate limiting", () => {
  it("hanya mempercayai IP tunggal dari Cloudflare", () => {
    expect(
      getClientIp(
        new Headers({
          "cf-connecting-ip": "192.0.2.40",
          "x-nf-client-connection-ip": "203.0.113.99",
          "x-real-ip": "203.0.113.10",
          "x-forwarded-for": "198.51.100.20",
        }),
      ),
    ).toBe("192.0.2.40");
  });

  it("menolak fallback proxy dan nilai Cloudflare yang tidak valid", () => {
    expect(
      getClientIp(
        new Headers({
          "x-nf-client-connection-ip": "203.0.113.99",
          "x-real-ip": "203.0.113.10",
          "x-forwarded-for": "198.51.100.20",
        }),
      ),
    ).toBe("unknown");
    expect(
      getClientIp(
        new Headers({ "cf-connecting-ip": "192.0.2.40, 198.51.100.1" }),
      ),
    ).toBe("unknown");
    expect(getClientIp(new Headers({ "cf-connecting-ip": "not-an-ip" }))).toBe(
      "unknown",
    );
  });

  it("memblokir setelah batas tercapai", async () => {
    const key = `test-${Math.random()}`;
    expect(await isRateLimited(key, { maxRequests: 2 }, 1_000)).toBe(false);
    expect(await isRateLimited(key, { maxRequests: 2 }, 1_001)).toBe(false);
    expect(await isRateLimited(key, { maxRequests: 2 }, 1_002)).toBe(true);
  });
});
