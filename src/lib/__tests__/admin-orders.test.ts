import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  aggregateDailySeries,
  persistOrderUpdate,
  type DailySeriesRow,
} from "@/lib/admin/orders";

describe("aggregateDailySeries", () => {
  const rows: DailySeriesRow[] = [
    { created_at: "2026-08-11T00:30:00+07:00", total: 50000, status: "BARU" },
    { created_at: "2026-08-11T10:00:00+07:00", total: 120000, status: "SELESAI" },
    { created_at: "2026-08-12T18:00:00+07:00", total: 70000, status: "BATAL" },
    { created_at: "2026-08-14T05:00:00+07:00", total: 30000, status: "SELESAI" },
  ];

  it("mengisi seluruh tanggal rentang 7 hari termasuk yang kosong", () => {
    const series = aggregateDailySeries(rows, "2026-08-11", "2026-08-17");
    expect(series).toHaveLength(7);
    expect(series.map((point) => point.date)).toEqual([
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
      "2026-08-17",
    ]);
    expect(series.find((p) => p.date === "2026-08-13")?.pesanan).toBe(0);
    expect(series.find((p) => p.date === "2026-08-13")?.omzet).toBe(0);
  });

  it("menghitung pesanan dari semua status", () => {
    const series = aggregateDailySeries(rows, "2026-08-11", "2026-08-12");
    expect(series.find((p) => p.date === "2026-08-11")?.pesanan).toBe(2);
    expect(series.find((p) => p.date === "2026-08-12")?.pesanan).toBe(1);
  });

  it("hanya menghitung omzet dari pesanan SELESAI", () => {
    const series = aggregateDailySeries(rows, "2026-08-11", "2026-08-14");
    // 11 Ags: 120.000 SELESAI (50.000 BARU diabaikan)
    expect(series.find((p) => p.date === "2026-08-11")?.omzet).toBe(120000);
    // 12 Ags: BATAL → omzet 0 walau ada 1 pesanan
    expect(series.find((p) => p.date === "2026-08-12")?.omzet).toBe(0);
    // 14 Ags: 30.000 SELESAI
    expect(series.find((p) => p.date === "2026-08-14")?.omzet).toBe(30000);
  });

  it("mengabaikan baris di luar rentang", () => {
    const series = aggregateDailySeries(rows, "2026-08-11", "2026-08-11");
    expect(series).toHaveLength(1);
    expect(series[0]).toEqual({
      date: "2026-08-11",
      pesanan: 2,
      omzet: 120000,
    });
  });

  it("mengembalikan satu titik nol untuk rentang satu hari tanpa data", () => {
    const series = aggregateDailySeries([], "2026-08-11", "2026-08-11");
    expect(series).toEqual([{ date: "2026-08-11", pesanan: 0, omzet: 0 }]);
  });
});

describe("persistOrderUpdate", () => {
  function updateClient(result: { data: unknown; error: unknown }) {
    const chain = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue(result),
    };
    chain.eq.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    const update = vi.fn().mockReturnValue(chain);
    const supabase = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as SupabaseClient;
    return { supabase, chain, update };
  }

  it("menulis dengan guard kode, versi, dan status lama", async () => {
    const saved = { code: "MK-260824-001", status: "DIKONFIRMASI" };
    const { supabase, chain, update } = updateClient({
      data: saved,
      error: null,
    });

    await expect(
      persistOrderUpdate(
        supabase,
        "MK-260824-001",
        { status: "BARU", updated_at: "2026-08-24T05:00:00.000Z" },
        { status: "DIKONFIRMASI" },
        true,
      ),
    ).resolves.toEqual(saved);

    expect(update).toHaveBeenCalledWith({ status: "DIKONFIRMASI" });
    expect(chain.eq).toHaveBeenNthCalledWith(1, "code", "MK-260824-001");
    expect(chain.eq).toHaveBeenNthCalledWith(
      2,
      "updated_at",
      "2026-08-24T05:00:00.000Z",
    );
    expect(chain.eq).toHaveBeenNthCalledWith(3, "status", "BARU");
  });

  it("mengembalikan 409 ketika compare-and-swap kalah oleh update lain", async () => {
    const { supabase } = updateClient({ data: null, error: null });

    await expect(
      persistOrderUpdate(
        supabase,
        "MK-260824-001",
        { status: "BARU", updated_at: "2026-08-24T05:00:00.000Z" },
        { status: "BATAL" },
        true,
      ),
    ).rejects.toMatchObject({ statusCode: 409, code: "ORDER_CONFLICT" });
  });

  it("menolak verifikasi order kedua ketika reference sudah dipakai", async () => {
    const { supabase } = updateClient({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key violates "orders_payment_reference_idx"',
      },
    });

    await expect(
      persistOrderUpdate(
        supabase,
        "MK-260904-002",
        { status: "BARU", updated_at: "2026-09-04T05:00:00.000Z" },
        {
          status: "DIKONFIRMASI",
          payment_reference: "QRIS-TRANSACTION-001",
        },
        true,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "PAYMENT_REFERENCE_ALREADY_USED",
    });
  });
});
