import type { LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

// Label nyata (bukan placeholder-only, docs/08 §8.8) — paling ringan,
// menempel lewat htmlFor. Catatan opsional (mis. "opsional") ditandai netral.
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  optional?: ReactNode;
  required?: boolean;
}

export function Label({
  optional,
  required,
  className,
  children,
  htmlFor,
  ...props
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-bold text-brown-deep",
        required && "after:ml-0.5 after:text-chili after:content-['*']",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="sr-only">(wajib diisi)</span>
      ) : null}
      {optional ? (
        <span className="ml-1 font-normal text-brown/60">({optional})</span>
      ) : null}
    </label>
  );
}
