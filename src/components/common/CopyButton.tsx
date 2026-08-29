"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label: string;
  successLabel?: string;
  /**
   * Override gaya untuk latar gelap (mis. hero status pesanan). Default-nya
   * varian terang: border emas + teks brown-deep.
   */
  className?: string;
}

export function CopyButton({
  value,
  label,
  successLabel = "Tersalin ✓",
  className,
}: CopyButtonProps) {
  const [isCopied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("[CopyButton]", error);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className={cn(
        "inline-flex min-h-8 sm:min-h-9 items-center gap-1.5 sm:gap-2 rounded-full border border-gold/40 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold text-brown-deep transition-colors hover:bg-gold/15",
        className,
      )}
    >
      {isCopied ? (
        <Check aria-hidden="true" className="size-3 sm:size-3.5 text-success" strokeWidth={2.25} />
      ) : (
        <Copy aria-hidden="true" className="size-3 sm:size-3.5" strokeWidth={1.75} />
      )}
      {isCopied ? successLabel : label}
    </button>
  );
}
