"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CopyButtonProps {
  value: string;
  label: string;
  successLabel?: string;
}

export function CopyButton({
  value,
  label,
  successLabel = "Tersalin ✓",
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
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 px-4 text-xs font-bold text-brown-deep transition-colors hover:bg-gold/15"
    >
      {isCopied ? (
        <Check aria-hidden="true" className="size-4 text-success" strokeWidth={2.25} />
      ) : (
        <Copy aria-hidden="true" className="size-4" strokeWidth={1.75} />
      )}
      {isCopied ? successLabel : label}
    </button>
  );
}
