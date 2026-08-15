import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/config/site";
import { cn } from "@/lib/utils";

const fabClassName =
  "fixed bottom-5 right-4 z-40 flex size-14 items-center justify-center rounded-full shadow-warm-lg transition-transform md:bottom-8 md:right-8";

export function WhatsAppFab() {
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
