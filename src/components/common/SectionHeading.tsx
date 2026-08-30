import { EyebrowRule } from "@/components/common/EyebrowRule";
import { Reveal } from "@/components/common/Reveal";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  level?: HeadingLevel;
  eyebrowVariant?: "gold" | "light";
  className?: string;
}

// Heading section reusable (docs/08 upgrade §6): gabungan EyebrowRule + judul
// serif + subtitle opsional, dibungkus Reveal. Menstandarkankan pola yang
// sebelumnya ditulis manual di tiap section (Tentang/Kontak/home). Mendukung
// latar terang (default) dan gelap (light) untuk dipakai di panel ink.
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  level = "h2",
  eyebrowVariant = "gold",
  className,
}: SectionHeadingProps) {
  const Tag = level;
  const isCenter = align === "center";
  const isLight = eyebrowVariant === "light";

  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        isCenter && "mx-auto text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5",
          isCenter && "justify-center",
        )}
      >
        <EyebrowRule variant={eyebrowVariant} />
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.2em]",
            isLight ? "text-gold-light" : "text-brown",
          )}
        >
          {eyebrow}
        </p>
        {isCenter ? <EyebrowRule variant={eyebrowVariant} /> : null}
      </div>
      <Tag
        className={cn(
          "mt-3 font-serif text-3xl font-bold leading-tight tracking-tight",
          isLight ? "text-cream" : "text-brown-deep",
          level === "h1" ? "md:text-4xl" : "md:text-[2rem]",
        )}
      >
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={cn(
            "mt-3 text-base leading-7",
            isLight ? "text-cream/75" : "text-brown/75",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}
