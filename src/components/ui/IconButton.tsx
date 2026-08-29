import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Tombol ikon-saja: size-11 (target sentuh 44px), wajib aria-label.
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "default" | "ghost" | "destructive";
}

const toneClass = {
  default: "bg-cream text-brown-deep shadow-warm hover:bg-gold/15",
  ghost: "bg-transparent text-brown hover:bg-gold/15 hover:text-brown-deep",
  destructive: "bg-chili text-white hover:bg-chili/90",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ tone = "ghost", className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
          "disabled:cursor-not-allowed disabled:opacity-50",
          toneClass[tone],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
