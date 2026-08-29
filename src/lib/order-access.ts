import { randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,64}$/;

export function generateOrderAccessToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isValidOrderAccessToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function tokensMatch(actual: string, supplied: string): boolean {
  if (!isValidOrderAccessToken(actual) || !isValidOrderAccessToken(supplied)) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    actualBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(actualBuffer, suppliedBuffer)
  );
}

export function buildPublicOrderUrl(
  path: "pesanan" | "pembayaran" | "invoice",
  code: string,
  token: string,
): string {
  return `/${path}/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`;
}
