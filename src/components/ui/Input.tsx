import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Input standar (docs/06 §input): border-gold/25 → focus:border-gold + ring,
// error = border-chili. Tidak pernah placeholder-only — Label wajib terpisah.
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-11 w-full rounded-xl border bg-cream px-4 text-sm text-brown-deep",
        "placeholder:text-brown/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        invalid
          ? "border-chili focus-visible:ring-chili"
          : "border-gold/25 focus:border-gold",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
