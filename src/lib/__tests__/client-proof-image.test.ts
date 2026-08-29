import { afterEach, describe, expect, it, vi } from "vitest";

import {
  calculateProofDimensions,
  preparePaymentProof,
  ProofImagePreparationError,
  TARGET_PROOF_SIZE_BYTES,
} from "@/lib/client-proof-image";
import { MAX_PROOF_SIZE_BYTES } from "@/lib/proof-image";

function installBrowserImageMocks(outputSize: number) {
  const close = vi.fn();
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage,
    })),
    toBlob: vi.fn((callback: BlobCallback, type: string) => {
      callback(new Blob([new Uint8Array(outputSize)], { type }));
    }),
  };
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({
    width: 4_000,
    height: 3_000,
    close,
  })));
  vi.stubGlobal("document", {
    createElement: vi.fn(() => canvas),
  });
  return { canvas, close, drawImage };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calculateProofDimensions", () => {
  it("mengecilkan sisi terpanjang tanpa mengubah rasio", () => {
    expect(calculateProofDimensions(4_000, 3_000, 1_600)).toEqual({
      width: 1_600,
      height: 1_200,
    });
  });

  it("tidak memperbesar gambar kecil", () => {
    expect(calculateProofDimensions(800, 600, 1_600)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("menolak dimensi yang tidak valid", () => {
    expect(() => calculateProofDimensions(0, 600)).toThrow(
      "Dimensi gambar tidak valid.",
    );
  });
});

describe("preparePaymentProof", () => {
  it("mendecode dan mengompres gambar sumber menjadi WebP di bawah target", async () => {
    const browser = installBrowserImageMocks(TARGET_PROOF_SIZE_BYTES - 1);
    const source = new File([new Uint8Array(2 * 1024 * 1024)], "bukti.jpg", {
      type: "image/jpeg",
    });

    const result = await preparePaymentProof(source);

    expect(result.type).toBe("image/webp");
    expect(result.size).toBeLessThanOrEqual(TARGET_PROOF_SIZE_BYTES);
    expect(browser.canvas.width).toBe(1);
    expect(browser.canvas.height).toBe(1);
    expect(browser.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1_920,
      1_440,
    );
    expect(browser.close).toHaveBeenCalledOnce();
  });

  it("gagal aman bila hasil seluruh percobaan tetap di atas 1MB", async () => {
    installBrowserImageMocks(MAX_PROOF_SIZE_BYTES + 1);
    const source = new File([new Uint8Array(2 * 1024 * 1024)], "bukti.jpg", {
      type: "image/jpeg",
    });

    await expect(preparePaymentProof(source)).rejects.toEqual(
      new ProofImagePreparationError(
        "Gambar masih lebih dari 1MB setelah dikompres. Pilih gambar lain.",
      ),
    );
  });

  it("menolak tipe sumber yang bukan gambar sebelum proses Canvas", async () => {
    const source = new File(["<html></html>"], "bukti.jpg", {
      type: "text/html",
    });

    await expect(preparePaymentProof(source)).rejects.toEqual(
      new ProofImagePreparationError("Pilih gambar JPG, PNG, atau WebP yang valid."),
    );
  });
});
