import Image from "next/image";
import Link from "next/link";

import { getWhatsAppUrl, siteConfig } from "@/config/site";

const categoryLinks = [
  { href: "/menu/taichan", label: "Taichan" },
  { href: "/menu/minuman", label: "Minuman" },
  { href: "/menu/chocoberry", label: "ChocoBerry" },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = getWhatsAppUrl(
    "Halo MAU'S Kitchen, aku mau tanya tentang menu.",
  );

  return (
    <footer className="bg-brown-deep text-cream">
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-4 lg:py-16">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/assets/brand/logo-maus-kitchen.jpeg"
              alt="Logo MAU'S Kitchen"
              width={64}
              height={64}
              className="size-16 rounded-full border border-gold/40 object-cover"
            />
            <div>
              <p className="font-serif text-xl font-bold">MAU&apos;S Kitchen</p>
              <p className="mt-1 text-sm text-gold-light">{siteConfig.tagline}</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-cream/75">
            Taichan, minuman segar, dan ChocoBerry yang disiapkan hangat dari
            dapur rumahan.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold-light">
            Pilih Menu
          </h2>
          <ul className="mt-4 space-y-1">
            {categoryLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center text-sm text-cream/80 transition-colors hover:text-gold-light"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold-light">
            Hubungi Kami
          </h2>
          <div className="mt-4 space-y-3 text-sm text-cream/80">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center hover:text-gold-light"
              >
                WhatsApp {siteConfig.whatsappDisplay}
              </a>
            ) : (
              <p>WhatsApp: TBD</p>
            )}
            <p>Jam operasional: TBD</p>
            <p>Alamat: TBD</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold-light">
            Pembayaran
          </h2>
          <p className="mt-4 text-sm leading-6 text-cream/80">
            QRIS, transfer BCA, serta tunai atau COD. Detail pembayaran
            dikonfirmasi bersama admin.
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex min-h-16 w-full max-w-content items-center justify-center px-4 text-center text-xs text-cream/60 md:px-8">
          © {currentYear} MAU&apos;S Kitchen · Dibuat dengan cinta dari dapur
          rumahan
        </div>
      </div>
    </footer>
  );
}
