const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, "") ?? "";

export const siteConfig = {
  name: "MAU'S Kitchen",
  tagline: "Homemade with Love",
  description:
    "Sate taichan pedas, minuman segar, dan ChocoBerry buah coklat premium.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappNumber,
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "TBD",
} as const;

export function getWhatsAppUrl(message?: string): string | null {
  if (!/^62[0-9]{8,13}$/.test(siteConfig.whatsappNumber)) {
    return null;
  }

  const baseUrl = "https://wa.me/" + siteConfig.whatsappNumber;

  return message ? baseUrl + "?text=" + encodeURIComponent(message) : baseUrl;
}
