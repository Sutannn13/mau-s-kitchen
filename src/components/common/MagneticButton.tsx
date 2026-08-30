import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  href: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  href,
}: MagneticButtonProps) {
  return (
    <Link
      href={href}
      className={cn("btn-press", className)}
    >
      {children}
    </Link>
  );
}
