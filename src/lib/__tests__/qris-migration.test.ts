import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260904053000_harden_qris_verification.sql",
  ),
  "utf8",
);

describe("QRIS verification migration contract", () => {
  it("mencegah reference yang sama dipakai lintas order", () => {
    expect(migration).toMatch(
      /create unique index if not exists orders_payment_reference_idx[\s\S]*on public\.orders \(payment_reference\)/i,
    );
  });

  it("menolak insert order yang sudah berstatus dibayar atau dikonfirmasi", () => {
    expect(migration).toContain("before insert on public.orders");
    expect(migration).toContain("New orders must start unpaid with BARU status");
  });

  it("melindungi metode dan bukti pembayaran dari perubahan bypass", () => {
    expect(migration).toMatch(
      /before update of status, payment_method, payment_proof_url, payment_claimed_at,[\s\S]*payment_reference, payment_verified_at on public\.orders/i,
    );
    expect(migration).toContain("Payment method is immutable");
    expect(migration).toContain("Payment proof is immutable after submission");
  });
});
