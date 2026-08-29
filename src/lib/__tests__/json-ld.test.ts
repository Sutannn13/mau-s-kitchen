import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "@/components/common/JsonLd";

describe("serializeJsonLd", () => {
  it("menghasilkan JSON biasa untuk data aman", () => {
    expect(serializeJsonLd({ name: "MAU'S Kitchen" })).toBe(
      '{"name":"MAU\'S Kitchen"}',
    );
  });

  it("membuat payload penutup script menjadi inert", () => {
    const result = serializeJsonLd({
      name: "</script><script>globalThis.pwned=true</script>",
    });

    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script>");
  });
});
