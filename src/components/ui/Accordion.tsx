"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// Accordion (shadcn approach, docs/08 upgrade §6): Radix primitive sebagai
// aksesibilitas (aria/keyboard otomatis), tapi styled penuh pakai token brand
// MAU'S Kitchen. Kepemilikan penuh di repo — bisa disesuaikan tanpa override
// upstream. Animasi buka/tutup memakai keyframe CSS + variabel
// --radix-accordion-content-height yang diset Radix (lebih andal lintas
// browser daripada motion height:auto, dan tidak butuh "use client" tambahan
// per item). Keyframe didefinisikan di tailwind.config.ts.
//
// Aksesibilitas: Radix sudah set aria-expanded, aria-controls, role=region,
// keyboard navigation (Tab/Enter/Space/Arrow). Kita cukup styling.

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(
        "overflow-hidden rounded-2xl border border-brown-deep/10 bg-cream shadow-warm",
        "data-[state=open]:border-gold/35 data-[state=open]:shadow-[0_6px_28px_rgba(199,154,75,0.14)]",
        "transition-[border-color,box-shadow] duration-300",
        className,
      )}
      {...props}
    />
  );
});

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex w-full items-center justify-between gap-3 px-5 py-4 text-left",
          "text-sm font-bold text-brown-deep md:text-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
          "btn-press",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-gold transition-transform duration-300 group-data-[state=open]:rotate-180"
          strokeWidth={2}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden",
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      )}
      {...props}
    >
      <div
        className={cn(
          "px-5 pb-4 text-sm leading-6 text-brown/75",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
