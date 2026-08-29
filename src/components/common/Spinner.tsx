import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Spinner bersama untuk tombol berstatus busy (docs/08): animasi berhenti
// otomatis bagi pengguna prefers-reduced-motion (motion-reduce).
export function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" className="inline-flex">
      <Loader2
        aria-hidden="true"
        className={cn("animate-spin motion-reduce:animate-none", className)}
        strokeWidth={2}
      />
      <span className="sr-only">Memuat…</span>
    </span>
  );
}
