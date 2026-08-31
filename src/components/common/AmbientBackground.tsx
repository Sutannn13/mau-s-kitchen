import Image from "next/image";

import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  /**
   * Sumber gambar ambient (food shot) yang di-blur lalu di-overlay dengan
   * gradient warm. Pakai image yang sudah ada di /assets/stitch/. Jika
   * diomit, hanya gradient mesh + grain + orbs yang dirender (cocok untuk
   * section dengan konten padat tanpa foto pengganggu).
   */
  imageSrc?: string;
  /** Variasi mood warna orbs dekoratif. Default "warm" untuk section cream. */
  tone?: "warm" | "cool" | "gold";
  /** Gambar overlay opacity (0-100). Default 55 untuk readability. */
  imageOpacity?: number;
  className?: string;
  /** Render orbs dekoratif? Default true. Matikan di section sempit. */
  showOrbs?: boolean;
  /** Tinggi minimal container. Default min-h-[60vh]. */
  minHeight?: string;
}

// Ambient background reusable (docs/08 upgrade §8): mengganti latar solid
// "klasik" dengan layered composition — gradient mesh warm (gold→rose→cream),
// grain texture SVG noise halus, dan orbs dekoratif dengan blur besar agar
// terlihat seperti cahaya ambient, bukan blob flat. Opsional menyertakan
// foto makanan yang di-blur + overlay gradient warm untuk readability.
//
// Prinsip anti-AI-slop: setiap layer punya tujuan (mesh = kedalaman, grain =
// tekstur organik, orbs = cahaya ambient, image = konteks kuliner). Tidak
// ada gradient pelangi generik; warna memakai palet brand MAU'S Kitchen
// (gold/rose/cream/brown-deep) lewat token Tailwind.
//
// Aksesibilitas: semua layer aria-hidden karena murni dekoratif.
// Performance: gradient & orbs adalah CSS murni (GPU-friendly). Foto
// dekoratif memakai next/image agar browser mendapat ukuran responsif.
export function AmbientBackground({
  imageSrc,
  tone = "warm",
  imageOpacity = 55,
  showOrbs = true,
  minHeight,
  className,
}: AmbientBackgroundProps) {
  const orbPalette =
    tone === "cool"
      ? "bg-gold-light/25"
      : tone === "gold"
        ? "bg-gold/30"
        : "bg-rose/30";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={minHeight ? { minHeight } : undefined}
    >
      {/* Layer 1: Gradient mesh warm (gold→rose→cream) — kedalaman. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(199,154,75,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(232,175,164,0.20),transparent_55%)]" />

      {/* Layer 2 (opsional): Foto makanan ambient — blur + brightness overlay
          + gradient warm di atasnya untuk readability konten. Bukan LCP
          (di belakang konten), jadi loading=lazy. */}
      {imageSrc ? (
        <>
          <Image
            src={imageSrc}
            alt=""
            fill
            loading="lazy"
            quality={60}
            sizes="100vw"
            className="absolute inset-0 size-full object-cover blur-[10px] brightness-110"
            style={{ opacity: imageOpacity / 100 }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cream/85 via-cream-soft/80 to-cream/90" />
        </>
      ) : null}

      {/* Layer 3: Orbs dekoratif — blur besar = cahaya ambient, bukan blob flat.
          Drift CSS-only (GPU transform, zero JS) untuk kesan hidup. */}
      {showOrbs ? (
        <>
          <div className={cn("absolute -left-20 top-10 size-72 rounded-full blur-3xl orb-drift-1", orbPalette)} />
          <div className={cn("absolute -right-16 bottom-0 size-80 rounded-full blur-3xl orb-drift-2", "bg-gold/20")} />
        </>
      ) : null}

      {/* Layer 4: Grain texture — tekstur organik halus (SVG noise inline,
          opacity rendah) supaya latar tidak terlihat "plastik" digital. */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
