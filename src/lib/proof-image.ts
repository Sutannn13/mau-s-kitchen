export const MAX_PROOF_SIZE_BYTES = 1024 * 1024;

const MAX_IMAGE_DIMENSION = 12_000;
const MAX_IMAGE_PIXELS = 40_000_000;

interface ProofFileLike {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface ValidatedProofImage {
  bytes: Uint8Array;
  extension: "jpg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function readUint16BigEndian(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}

function readUint16LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16)
  );
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) * 0x1_00_00_00 +
    ((bytes[offset + 1] ?? 0) << 16) +
    ((bytes[offset + 2] ?? 0) << 8) +
    (bytes[offset + 3] ?? 0)
  );
}

function readUint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) +
    ((bytes[offset + 1] ?? 0) << 8) +
    ((bytes[offset + 2] ?? 0) << 16) +
    (bytes[offset + 3] ?? 0) * 0x1_00_00_00
  );
}

function hasSafeDimensions(width: number, height: number): boolean {
  return (
    width > 0 &&
    height > 0 &&
    width <= MAX_IMAGE_DIMENSION &&
    height <= MAX_IMAGE_DIMENSION &&
    width * height <= MAX_IMAGE_PIXELS
  );
}

function isStartOfFrameMarker(marker: number): boolean {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  );
}

function isStructuredJpeg(bytes: Uint8Array): boolean {
  if (
    bytes.length < 16 ||
    !startsWith(bytes, [0xff, 0xd8]) ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    return false;
  }

  let offset = 2;
  let hasFrame = false;

  while (offset < bytes.length - 2) {
    if (bytes[offset] !== 0xff) {
      return false;
    }
    while (bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];
    offset += 1;
    if (marker === undefined || marker === 0x00 || marker === 0xd8) {
      return false;
    }
    if (marker === 0xd9) {
      return false;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 2 > bytes.length) {
      return false;
    }

    const segmentLength = readUint16BigEndian(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return false;
    }

    if (isStartOfFrameMarker(marker)) {
      if (segmentLength < 8) {
        return false;
      }
      const height = readUint16BigEndian(bytes, offset + 3);
      const width = readUint16BigEndian(bytes, offset + 5);
      if (!hasSafeDimensions(width, height)) {
        return false;
      }
      hasFrame = true;
    }

    if (marker === 0xda) {
      return hasFrame && offset + segmentLength <= bytes.length - 2;
    }

    offset += segmentLength;
  }

  return false;
}

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  );
}

function isStructuredPng(bytes: Uint8Array): boolean {
  if (
    bytes.length < 57 ||
    !startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return false;
  }

  let offset = 8;
  let chunkIndex = 0;
  let hasImageData = false;

  while (offset + 12 <= bytes.length) {
    const dataLength = readUint32BigEndian(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    const chunkEnd = offset + 12 + dataLength;
    if (chunkEnd > bytes.length) {
      return false;
    }

    if (chunkIndex === 0) {
      if (type !== "IHDR" || dataLength !== 13) {
        return false;
      }
      const width = readUint32BigEndian(bytes, offset + 8);
      const height = readUint32BigEndian(bytes, offset + 12);
      if (!hasSafeDimensions(width, height)) {
        return false;
      }
    } else if (type === "IDAT") {
      hasImageData = true;
    } else if (type === "IEND") {
      return dataLength === 0 && hasImageData && chunkEnd === bytes.length;
    }

    offset = chunkEnd;
    chunkIndex += 1;
  }

  return false;
}

function webpDimensionsAreSafe(
  bytes: Uint8Array,
  type: string,
  dataOffset: number,
  dataLength: number,
): boolean {
  if (type === "VP8X") {
    if (dataLength < 10) return false;
    const width = readUint24LittleEndian(bytes, dataOffset + 4) + 1;
    const height = readUint24LittleEndian(bytes, dataOffset + 7) + 1;
    return hasSafeDimensions(width, height);
  }

  if (type === "VP8L") {
    if (dataLength < 5 || bytes[dataOffset] !== 0x2f) return false;
    const first = bytes[dataOffset + 1] ?? 0;
    const second = bytes[dataOffset + 2] ?? 0;
    const third = bytes[dataOffset + 3] ?? 0;
    const fourth = bytes[dataOffset + 4] ?? 0;
    const width = 1 + first + ((second & 0x3f) << 8);
    const height = 1 + (second >> 6) + (third << 2) + ((fourth & 0x0f) << 10);
    return hasSafeDimensions(width, height);
  }

  if (type === "VP8 ") {
    if (
      dataLength < 10 ||
      bytes[dataOffset + 3] !== 0x9d ||
      bytes[dataOffset + 4] !== 0x01 ||
      bytes[dataOffset + 5] !== 0x2a
    ) {
      return false;
    }
    const width = readUint16LittleEndian(bytes, dataOffset + 6) & 0x3fff;
    const height = readUint16LittleEndian(bytes, dataOffset + 8) & 0x3fff;
    return hasSafeDimensions(width, height);
  }

  return false;
}

function isStructuredWebp(bytes: Uint8Array): boolean {
  if (
    bytes.length < 20 ||
    !startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) ||
    chunkType(bytes, 8) !== "WEBP" ||
    readUint32LittleEndian(bytes, 4) + 8 !== bytes.length
  ) {
    return false;
  }

  let offset = 12;
  let hasImageChunk = false;
  while (offset + 8 <= bytes.length) {
    const type = chunkType(bytes, offset);
    const dataLength = readUint32LittleEndian(bytes, offset + 4);
    const dataOffset = offset + 8;
    const chunkEnd = dataOffset + dataLength;
    const paddedEnd = chunkEnd + (dataLength % 2);
    if (paddedEnd > bytes.length) {
      return false;
    }
    if (type === "VP8 " || type === "VP8L" || type === "VP8X") {
      if (!webpDimensionsAreSafe(bytes, type, dataOffset, dataLength)) {
        return false;
      }
      hasImageChunk = true;
    }
    offset = paddedEnd;
  }

  return hasImageChunk && offset === bytes.length;
}

// Cloudflare Workers tidak menyediakan decoder gambar native. Validasi ini
// memeriksa batas ukuran, signature, struktur container, serta dimensi; browser
// pelanggan melakukan decode dan normalisasi sebelum file mencapai endpoint.
export async function validateProofImage(
  file: ProofFileLike,
): Promise<ValidatedProofImage | null> {
  if (file.size <= 0 || file.size > MAX_PROOF_SIZE_BYTES) {
    return null;
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength !== file.size) {
    return null;
  }
  const bytes = new Uint8Array(buffer);

  if (isStructuredJpeg(bytes)) {
    return { bytes, extension: "jpg", mimeType: "image/jpeg" };
  }
  if (isStructuredPng(bytes)) {
    return { bytes, extension: "png", mimeType: "image/png" };
  }
  if (isStructuredWebp(bytes)) {
    return { bytes, extension: "webp", mimeType: "image/webp" };
  }

  return null;
}
