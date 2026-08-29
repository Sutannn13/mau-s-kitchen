import { cn } from "@/lib/utils";

// Blok skeleton — pulse halus, hormati reduced-motion. (docs/08 §8.9, A7)
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse motion-reduce:animate-none rounded-lg bg-brown/10",
        className,
      )}
      {...props}
    />
  );
}
