import type { ReactNode } from "react";

import { getWhatsAppUrl } from "@/config/site";
import { cn } from "@/lib/utils";

interface WhatsAppLinkProps {
  children: ReactNode;
  className?: string;
  message: string;
}

export function WhatsAppLink({
  children,
  className,
  message,
}: WhatsAppLinkProps) {
  const whatsappUrl = getWhatsAppUrl(message);

  if (!whatsappUrl) {
    return (
      <span
        className={cn(className, "cursor-not-allowed opacity-60")}
        aria-disabled="true"
        title="WhatsApp belum dikonfigurasi"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
