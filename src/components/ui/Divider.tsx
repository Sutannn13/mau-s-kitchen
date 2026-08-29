import { cn } from "@/lib/utils";

// Pemisah halus — ornamen garis emas tipis (docs/06). Bebas dekoratif.
export function Divider({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("h-px w-full bg-gold/25", className)}
      {...props}
    />
  );
}
