import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderRow } from "@/lib/order-db";

const mocks = vi.hoisted(() => ({
  findOrderRowsByCode: vi.fn(),
  getAuthorizedAdminServiceClient: vi.fn(),
  rowToOrder: vi.fn(),
}));

vi.mock("@/lib/order-db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/order-db")>()),
  findOrderRowsByCode: mocks.findOrderRowsByCode,
  rowToOrder: mocks.rowToOrder,
}));

vi.mock("@/lib/supabase/current-admin", () => ({
  getAuthorizedAdminServiceClient: mocks.getAuthorizedAdminServiceClient,
}));

import { updateOrder } from "@/lib/admin/orders";

function buildRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    code: "MK-260904-001",
    public_token: "a".repeat(43),
    created_at: "2026-09-04T04:00:00.000Z",
    updated_at: "2026-09-04T04:05:00.000Z",
    customer_name: "Rizky",
    customer_wa: "6281234567890",
    order_type: "ambil",
    address: null,
    address_note: null,
    scheduled_at: null,
    customer_note: null,
    subtotal: 25_000,
    delivery_fee: 0,
    delivery_provider: null,
    courier_cost: null,
    total: 25_000,
    payment_method: "qris",
    payment_proof_url: "payment-proofs/qris.webp",
    payment_claimed_at: "2026-09-04T04:04:00.000Z",
    payment_reference: null,
    payment_verified_at: null,
    status: "BARU",
    admin_note: null,
    ...overrides,
  };
}

function updateClient() {
  const chain = {
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: buildRow({ status: "DIKONFIRMASI" }),
      error: null,
    }),
  };
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  const update = vi.fn().mockReturnValue(chain);
  return {
    client: { from: vi.fn().mockReturnValue({ update }) } as unknown as SupabaseClient,
    update,
  };
}

describe("updateOrder QRIS verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rowToOrder.mockReturnValue({ code: "MK-260904-001" });
  });

  it("menulis proof-bound reference dan verifikasi secara atomik", async () => {
    const row = buildRow();
    const { client, update } = updateClient();
    mocks.getAuthorizedAdminServiceClient.mockResolvedValue(client);
    mocks.findOrderRowsByCode.mockResolvedValue({ row, itemRows: [] });

    await updateOrder(row.code, {
      status: "DIKONFIRMASI",
      paymentVerified: true,
      paymentReference: "  qris-transaction-001  ",
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "DIKONFIRMASI",
        payment_reference: "QRIS-TRANSACTION-001",
        payment_verified_at: expect.any(String),
      }),
    );
  });

  it("menolak klaim QRIS tanpa bukti unggahan", async () => {
    const row = buildRow({ payment_proof_url: null });
    const { client, update } = updateClient();
    mocks.getAuthorizedAdminServiceClient.mockResolvedValue(client);
    mocks.findOrderRowsByCode.mockResolvedValue({ row, itemRows: [] });

    await expect(
      updateOrder(row.code, {
        status: "DIKONFIRMASI",
        paymentVerified: true,
        paymentReference: "QRIS-TRANSACTION-002",
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_PROOF_REQUIRED" });
    expect(update).not.toHaveBeenCalled();
  });

  it("menolak QRIS berbukti tanpa reference merchant", async () => {
    const row = buildRow();
    const { client, update } = updateClient();
    mocks.getAuthorizedAdminServiceClient.mockResolvedValue(client);
    mocks.findOrderRowsByCode.mockResolvedValue({ row, itemRows: [] });

    await expect(
      updateOrder(row.code, {
        status: "DIKONFIRMASI",
        paymentVerified: true,
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_REFERENCE_REQUIRED" });
    expect(update).not.toHaveBeenCalled();
  });

  it("mempertahankan verifikasi transfer dengan klaim tanpa reference QRIS", async () => {
    const row = buildRow({
      payment_method: "transfer",
      payment_proof_url: null,
    });
    const { client, update } = updateClient();
    mocks.getAuthorizedAdminServiceClient.mockResolvedValue(client);
    mocks.findOrderRowsByCode.mockResolvedValue({ row, itemRows: [] });

    await updateOrder(row.code, {
      status: "DIKONFIRMASI",
      paymentVerified: true,
    });

    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ payment_reference: expect.anything() }),
    );
  });
});
