import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Kontainer kartu photo-led (docs/06 §card): border-gold/30, shadow-warm,
// rounded-2xl. Variasi `muted` = tanpa shadow untuk seksi dekoratif. Prop `as`
// menjaga semantik (article/li/section) tanpa kehilangan token gaya.
type CardElement = "div" | "article" | "section" | "li";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  muted?: boolean;
  as?: CardElement;
}

export function Card({ muted, as = "div", className, ...props }: CardProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        "rounded-2xl border border-gold/30 bg-cream-soft",
        muted ? "shadow-none" : "shadow-warm",
        className,
      )}
      {...props}
    />
  );
}
