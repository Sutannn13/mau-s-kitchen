import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Textarea standar — paritas gaya dengan Input (docs/06 §input).
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-xl border bg-cream px-4 py-3 text-sm text-brown-deep",
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
  },
);
