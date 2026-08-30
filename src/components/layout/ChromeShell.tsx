"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { cn } from "@/lib/utils";

// Sebelumnya penyembunyian chrome publik pada rute /admin/* mengandalkan
// header `x-admin-route` yang ditempel proxy (src/proxy.ts). Next.js 16
// memaksa proxy memakai runtime Node.js yang tidak didukung OpenNext
// Cloudflare (Edge-only), jadi proxy dihapus dan deteksi dialihkan ke
// pathname di sisi klien. Area admin punya shell sidebar sendiri
// (AdminSidebar + MotionProvider di (panel)/layout.tsx); chrome pelanggan
// disembunyikan agar dashboard terasa premium & fokus.
export function ChromeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStandaloneDocument = pathname.startsWith("/invoice/");

  if (isAdminRoute || isStandaloneDocument) {
    return <>{children}</>;
  }

  return (
      <div className={cn("flex min-h-screen flex-col", "pb-16 md:pb-0")}>
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <WhatsAppFab />
        <MobileBottomBar />
      </div>
  );
}
