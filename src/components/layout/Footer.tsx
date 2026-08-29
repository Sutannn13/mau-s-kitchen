import Link from "next/link";

import { getWhatsAppUrl } from "@/config/site";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = getWhatsAppUrl(
    "Halo MAU'S Kitchen, aku mau tanya tentang menu dan pesanan.",
  );

  return (
    <footer className="border-t border-[#EAE3DB] bg-[#F7EEE4] text-brown-deep">
      <div className="mx-auto flex w-full max-w-content flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row md:gap-6 md:px-8 md:py-10">
        {/* Sisi Kiri: Brand & Hak Cipta */}
        <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <p className="font-serif text-lg font-bold tracking-tight text-brown-deep">
            MAU&apos;S Kitchen
          </p>
          <p className="text-xs text-brown/80">
            &copy; {currentYear} MAU&apos;S Kitchen. All rights reserved.
          </p>
        </div>

        {/* Sisi Kanan: Tautan Footer */}
        <nav
          aria-label="Navigasi kaki"
          className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-brown/80 sm:text-sm"
        >
          <Link
            href="/privasi"
            className="transition-colors hover:text-brown-deep hover:underline hover:underline-offset-4"
          >
            Kebijakan Privasi
          </Link>
          <Link
            href="/tentang"
            className="transition-colors hover:text-brown-deep hover:underline hover:underline-offset-4"
          >
            Tentang Kami
          </Link>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-brown-deep hover:underline hover:underline-offset-4"
            >
              Hubungi Kami
            </a>
          ) : (
            <Link
              href="/kontak"
              className="transition-colors hover:text-brown-deep hover:underline hover:underline-offset-4"
            >
              Hubungi Kami
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
