import { siteConfig } from "@/config/site";

function getConfiguredOrigin(): string | null {
  try {
    return new URL(siteConfig.siteUrl).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrderRequest(headers: Headers): boolean {
  const fetchSite = headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite !== undefined && fetchSite !== "same-origin") {
    return false;
  }

  const originHeader = headers.get("origin");
  if (originHeader === null) {
    return fetchSite === "same-origin";
  }

  const origin = originHeader.trim();
  if (!origin) {
    return false;
  }

  const configuredOrigin = getConfiguredOrigin();
  if (!configuredOrigin) {
    return false;
  }

  try {
    return new URL(origin).origin === configuredOrigin;
  } catch {
    return false;
  }
}
