import { describe, expect, it } from "vitest";

import { findNearestVisibleRect, type ScreenRect } from "@/lib/cart-animation";

const source: ScreenRect = { left: 100, top: 300, width: 40, height: 40 };

describe("findNearestVisibleRect", () => {
  it("memilih target keranjang terlihat yang paling dekat", () => {
    const header = { left: 320, top: 20, width: 44, height: 44, id: "header" };
    const mobileBar = {
      left: 160,
      top: 600,
      width: 44,
      height: 44,
      id: "mobile",
    };

    expect(findNearestVisibleRect(source, [header, mobileBar])).toBe(mobileBar);
  });

  it("mengabaikan target tersembunyi dan mengembalikan null bila tidak ada", () => {
    const hidden = { left: 0, top: 0, width: 0, height: 0 };

    expect(findNearestVisibleRect(source, [hidden])).toBeNull();
    expect(findNearestVisibleRect(source, [])).toBeNull();
  });
});
