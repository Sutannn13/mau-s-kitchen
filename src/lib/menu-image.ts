export const MAX_MENU_IMAGE_BYTES = 3 * 1024 * 1024;

interface MenuFileLike {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface ValidatedMenuImage {
  bytes: Uint8Array;
  extension: "jpg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

// Validasi menu image via magic bytes. Tidak memakai `sharp` (modul native Node)
// agar kompatibel dengan runtime Cloudflare Workers. Format asli disimpan apa
// adanya; batas ukuran 3MB sudah cukup untuk image mentah.
export async function validateMenuImage(
  file: MenuFileLike,
): Promise<ValidatedMenuImage | null> {
  if (file.size <= 0 || file.size > MAX_MENU_IMAGE_BYTES) {
    return null;
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength !== file.size) {
    return null;
  }
  const bytes = new Uint8Array(buffer);

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { bytes, extension: "jpg", mimeType: "image/jpeg" };
  }
  if (
    startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { bytes, extension: "png", mimeType: "image/png" };
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { bytes, extension: "webp", mimeType: "image/webp" };
  }

  return null;
}
