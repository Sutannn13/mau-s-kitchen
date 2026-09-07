import { describe, expect, it } from "vitest";

import { metadata } from "@/app/pesanan/layout";

describe("metadata /pesanan", () => {
  it("menetapkan title dan description halaman pelacakan", () => {
    expect(metadata.title).toBe("Lacak Pesanan");
    expect(metadata.description).toBe(
      "Lacak status pesanan kamu dengan kode pesanan MAU'S Kitchen.",
    );
  });
});
