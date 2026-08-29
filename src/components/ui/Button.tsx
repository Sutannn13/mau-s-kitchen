import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { Spinner } from "@/components/common/Spinner";
import { cn } from "@/lib/utils";

// Variants tombol (docs/08 upgrade §5): primary = pill emas / teks brown-deep,
// secondary = outline brown, ghost = transparan, destructive = chili, admin =
// netral padat. Semua min-h-11 (default) / min-h-12 (lg); ring fokus-gold.
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "admin";

export type ButtonSize = "default" | "lg" | "sm" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-gold text-brown-deep shadow-warm hover:bg-gold-light",
  secondary:
    "border border-brown/40 bg-transparent text-brown-deep hover:border-brown hover:bg-brown-deep hover:text-cream",
  ghost: "bg-transparent text-brown hover:bg-gold/15 hover:text-brown-deep",
  destructive: "bg-chili text-white shadow-warm hover:bg-chili/90",
  admin:
    "border border-ink/15 bg-ink-soft text-cream hover:bg-ink disabled:hover:bg-ink-soft",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "min-h-11 rounded-full px-6 text-sm font-bold",
  lg: "min-h-12 rounded-full px-6 text-sm font-bold",
  sm: "min-h-11 rounded-full px-4 text-xs font-semibold",
  icon: "size-11 rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "default",
    loading = false,
    loadingLabel,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
});
