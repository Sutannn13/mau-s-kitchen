import { cn } from "@/lib/utils";

interface EyebrowRuleProps {
  variant?: "gold" | "light";
  className?: string;
}

// Garis aksen untuk eyebrow section. Gradient gold→gold-light dengan
// dot kecil di ujung, lebih berkarakter dari h-px plain.
// Variant "light" untuk background gelap (stub/BrandValues/ChocoBerry).
export function EyebrowRule({ variant = "gold", className }: EyebrowRuleProps) {
  const barColor =
    variant === "light"
      ? "from-gold-light/60 to-gold-light"
      : "from-gold/60 to-gold";
  const dotColor = variant === "light" ? "bg-gold-light" : "bg-gold";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        className,
      )}
      aria-hidden="true"
    >
      <span className={cn("h-px w-8 bg-gradient-to-r", barColor)} />
      <span className={cn("size-1 rounded-full", dotColor)} />
    </span>
  );
}
