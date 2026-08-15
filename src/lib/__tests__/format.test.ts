import { describe, expect, it } from "vitest";

import { formatRupiah } from "@/lib/format";
import { getMenuItemById } from "@/lib/menu";

describe("formatRupiah", () => {
  it("memformat harga menu tanpa spasi dan desimal", () => {
    const item = getMenuItemById("taichan-daging");

    expect(item).toBeDefined();
    expect(formatRupiah(item?.basePrice ?? 0)).toBe("Rp35.000");
  });

  it("memformat nol rupiah", () => {
    expect(formatRupiah(0)).toBe("Rp0");
  });

  it("menolak nilai pecahan dan negatif", () => {
    expect(() => formatRupiah(1.5)).toThrow(RangeError);
    expect(() => formatRupiah(-1)).toThrow(RangeError);
  });
});
