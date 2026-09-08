import { describe, expect, it } from "vitest";

import { extractMenuImagePath } from "@/lib/menu-image";

const BUCKET_URL =
  "https://abcdef.supabase.co/storage/v1/object/public/menu-images";

describe("extractMenuImagePath", () => {
  it("mengekstrak path upload ber-UUID untuk jpg, png, dan webp", () => {
    expect(
      extractMenuImagePath(
        `${BUCKET_URL}/taichan-daging.11111111-2222-3333-4444-555555555555.jpg`,
      ),
    ).toBe("taichan-daging.11111111-2222-3333-4444-555555555555.jpg");
    expect(
      extractMenuImagePath(
        `${BUCKET_URL}/choco-berry-grape.aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png`,
      ),
    ).toBe("choco-berry-grape.aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png");
    expect(
      extractMenuImagePath(
        `${BUCKET_URL}/es-teh.0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f.webp`,
      ),
    ).toBe("es-teh.0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f.webp");
  });

  it("mendekode persen-encoding pada nama file", () => {
    expect(
      extractMenuImagePath(`${BUCKET_URL}/roti%20bakar.abc.jpg`),
    ).toBe("roti bakar.abc.jpg");
  });

  it("mengembalikan null untuk URL aset lokal, eksternal, atau kosong", () => {
    expect(extractMenuImagePath("/images/taichan-daging.jpg")).toBeNull();
    expect(
      extractMenuImagePath("https://cdn.contoh.com/foto/menu.jpg"),
    ).toBeNull();
    expect(extractMenuImagePath("")).toBeNull();
  });

  it("menolak path traversal dan path diawali garis miring", () => {
    expect(extractMenuImagePath(`${BUCKET_URL}/%2E%2E%2Frahasia.txt`)).toBeNull();
    expect(extractMenuImagePath(`${BUCKET_URL}/..%2F..%2Fx.jpg`)).toBeNull();
    expect(extractMenuImagePath(`${BUCKET_URL}/%2Fetc%2Fpass`)).toBeNull();
  });

  it("menolak persen-encoding tidak valid", () => {
    expect(extractMenuImagePath(`${BUCKET_URL}/broken%zz.jpg`)).toBeNull();
  });
});
