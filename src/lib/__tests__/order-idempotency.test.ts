import { describe, expect, it } from "vitest";

import {
  CHECKOUT_IDEMPOTENCY_STORAGE_KEY,
  getCheckoutIdempotencyKey,
} from "@/lib/order-idempotency";

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("getCheckoutIdempotencyKey", () => {
  it("memakai ulang key untuk retry payload yang sama", async () => {
    const storage = memoryStorage();
    const first = await getCheckoutIdempotencyKey("payload-a", storage, crypto);
    const retry = await getCheckoutIdempotencyKey("payload-a", storage, crypto);

    expect(retry).toBe(first);
    expect(storage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY)).toContain(first);
  });

  it("membuat key baru ketika payload checkout berubah", async () => {
    const storage = memoryStorage();
    const first = await getCheckoutIdempotencyKey("payload-a", storage, crypto);
    const changed = await getCheckoutIdempotencyKey("payload-b", storage, crypto);

    expect(changed).not.toBe(first);
  });
});
