import type { ReactNode } from "react";

// CSS-only scroll-driven entrance (zero JS, zero hydration).
// Menggantikan Motion IntersectionObserver. Memakai animation-timeline:
// view() bila didukung browser (Chrome 115+, Safari 17+, Firefox 110+),
// fallback ke animation biasa. prefers-reduced-motion dimatikan oleh
// jaring pengaman global di globals.css @layer base.
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <div className={`scroll-reveal ${className ?? ""}`}>
      {children}
    </div>
  );
}
