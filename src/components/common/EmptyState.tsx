import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Kondisi kosong bersama (docs/08 §8.9): ilustrasi/ikon + copy hangat + CTA
// opsional. Tidak ada warna-saja — selalu ada teks penjelas. headingLevel
// memungkinkan halaman 404 memakai h1 (struktur heading halaman tetap sah).
export interface EmptyStateProps {
  icon?: ReactNode;        // lucide-react icon (size ditentukan di sini)
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;      // tombol/link CTA
  headingLevel?: "h1" | "h2";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = "h2",
  className,
}: EmptyStateProps) {
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold"
        >
          {icon}
        </div>
      ) : null}
      <Heading className="font-serif text-xl font-bold text-brown-deep md:text-2xl">
        {title}
      </Heading>
      {description ? (
        <p className="max-w-md text-sm leading-6 text-brown/75">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
