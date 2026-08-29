import { describe, expect, it } from "vitest";

import { getStatusMenuPosition } from "@/lib/admin/status-menu-position";

describe("getStatusMenuPosition", () => {
  it("membuka menu di bawah tombol ketika ruang cukup", () => {
    expect(
      getStatusMenuPosition(
        { top: 100, right: 900, bottom: 144 },
        { width: 1024, height: 768 },
      ),
    ).toEqual({ left: 692, top: 152, transformOrigin: "top right" });
  });

  it("membuka ke atas dan menjaga menu di dalam viewport sempit", () => {
    expect(
      getStatusMenuPosition(
        { top: 500, right: 350, bottom: 544 },
        { width: 360, height: 640 },
      ),
    ).toEqual({ left: 140, bottom: 148, transformOrigin: "bottom right" });
  });
});
