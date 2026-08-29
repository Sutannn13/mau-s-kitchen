const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, "") ??
  "6281617691585";

function optionalPublicValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.toUpperCase() !== "TBD" ? normalized : null;
}

export const siteConfig = {
  name: "MAU'S Kitchen",
  tagline: "Homemade with Love",
  description:
    "Sate taichan pedas, minuman segar, dan ChocoBerry buah coklat premium.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappNumber,
  whatsappDisplay:
    process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "0816-1769-1585",
  businessHours: optionalPublicValue(process.env.NEXT_PUBLIC_BUSINESS_HOURS),
  businessAddress: optionalPublicValue(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
} as const;

export function getWhatsAppUrl(message?: string): string | null {
  if (!/^62[0-9]{8,13}$/.test(siteConfig.whatsappNumber)) {
    return null;
  }

  const baseUrl = "https://wa.me/" + siteConfig.whatsappNumber;

  return message ? baseUrl + "?text=" + encodeURIComponent(message) : baseUrl;
}
