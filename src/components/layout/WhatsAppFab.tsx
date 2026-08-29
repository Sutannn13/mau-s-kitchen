"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/config/site";
import { cn } from "@/lib/utils";

const fabClassName =
  // z-fab (40) di bawah sticky bar/toast/dialog. Pada seluler (di bawah md)
  // mobile nav bar menempati dasar layar, sehingga FAB diangkat ke atasnya
  // (bottom-20 ≈ 80px, melebihi tinggi batang ~64px + safe-area). Desktop
  // kembali ke bottom-8 (batang nav sembunyi pada md+).
  "fixed right-4 z-fab flex size-14 items-center justify-center rounded-full shadow-warm-lg transition-transform bottom-20 md:bottom-8 md:right-8";

export function WhatsAppFab() {
  const pathname = usePathname() ?? "/";

  // Sembunyikan FAB pada halaman dengan sticky CTA bar (produk detail, checkout, pembayaran)
  // agar tidak tumpang tindih dengan tombol pesan/kuantitas.
  if (
    pathname.startsWith("/produk") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/pembayaran")
  ) {
    return null;
  }

  const whatsappUrl = getWhatsAppUrl(
    "Halo MAU'S Kitchen, aku mau lihat menu dan pesan.",
  );

  if (!whatsappUrl) {
    return (
      <span
        className={cn(fabClassName, "cursor-not-allowed bg-neutral-300 text-neutral-500")}
        aria-label="WhatsApp belum dikonfigurasi"
        title="WhatsApp belum dikonfigurasi"
      >
        <MessageCircle aria-hidden="true" className="size-7" strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        fabClassName,
        "bg-success text-white hover:-translate-y-1 hover:bg-success/90",
      )}
      aria-label="Pesan MAU'S Kitchen melalui WhatsApp"
    >
      <MessageCircle aria-hidden="true" className="size-7" strokeWidth={1.75} />
    </a>
  );
}
