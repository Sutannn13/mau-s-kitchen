import { MAX_PROOF_SIZE_BYTES } from "@/lib/proof-image";

export const MAX_SOURCE_PROOF_SIZE_BYTES = 4 * 1024 * 1024;
export const TARGET_PROOF_SIZE_BYTES = 700 * 1024;

const MAX_OUTPUT_EDGE = 1_920;
const OUTPUT_EDGES = [1_920, 1_600, 1_280] as const;
const OUTPUT_QUALITIES = [0.82, 0.74, 0.66, 0.58] as const;
const ALLOWED_SOURCE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close(): void;
}

export interface ProofDimensions {
  width: number;
  height: number;
}

export class ProofImagePreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProofImagePreparationError";
  }
}

export function calculateProofDimensions(
  width: number,
  height: number,
  maxEdge = MAX_OUTPUT_EDGE,
): ProofDimensions {
  if (width <= 0 || height <= 0 || maxEdge <= 0) {
    throw new Error("Dimensi gambar tidak valid.");
  }
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
      image.src = objectUrl;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/webp",
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Browser tidak dapat memproses gambar."));
      }
    }, type, quality);
  });
}

function outputExtension(type: string): "jpg" | "png" | "webp" {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}

// Canvas native menghindari dependency image-processing besar. Naikkan ke
// pipeline server/WASM hanya bila bukti dari browser lama sering gagal diproses.
export async function preparePaymentProof(file: File): Promise<File> {
  if (file.size <= 0) {
    throw new ProofImagePreparationError("Berkas bukti bayar kosong.");
  }
  if (file.size > MAX_SOURCE_PROOF_SIZE_BYTES) {
    throw new ProofImagePreparationError("Gambar asli maksimal 4MB.");
  }
  if (!ALLOWED_SOURCE_TYPES.has(file.type)) {
    throw new ProofImagePreparationError(
      "Pilih gambar JPG, PNG, atau WebP yang valid.",
    );
  }

  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    throw new ProofImagePreparationError(
      "Gambar tidak dapat dibaca atau formatnya tidak valid.",
    );
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    decoded.close();
    throw new ProofImagePreparationError("Browser tidak dapat memproses gambar.");
  }

  let smallestBlob: Blob | null = null;
  try {
    for (const maxEdge of OUTPUT_EDGES) {
      const dimensions = calculateProofDimensions(
        decoded.width,
        decoded.height,
        maxEdge,
      );
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, dimensions.width, dimensions.height);
      context.drawImage(decoded.source, 0, 0, dimensions.width, dimensions.height);

      for (const quality of OUTPUT_QUALITIES) {
        const blob = await canvasToBlob(canvas, "image/webp", quality);
        if (!ALLOWED_SOURCE_TYPES.has(blob.type)) {
          throw new ProofImagePreparationError(
            "Browser tidak mendukung format gambar hasil kompresi.",
          );
        }
        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
        }
        if (blob.size <= TARGET_PROOF_SIZE_BYTES) {
          const extension = outputExtension(blob.type);
          return new File([blob], `bukti-bayar.${extension}`, { type: blob.type });
        }
      }
    }

    if (smallestBlob && smallestBlob.size <= MAX_PROOF_SIZE_BYTES) {
      const extension = outputExtension(smallestBlob.type);
      return new File([smallestBlob], `bukti-bayar.${extension}`, {
        type: smallestBlob.type,
      });
    }
    throw new ProofImagePreparationError(
      "Gambar masih lebih dari 1MB setelah dikompres. Pilih gambar lain.",
    );
  } finally {
    decoded.close();
    canvas.width = 1;
    canvas.height = 1;
  }
}
