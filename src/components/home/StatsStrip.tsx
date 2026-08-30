import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: LucideIcon;
}

// StatsStrip (docs/08 upgrade §8): strip gelap dengan CountUp yang sudah ada,
// kini ditingkatkan dengan ikon per-stat + divider vertikal antar kolom.
// Tetap memakai bg-brown-deep/text-cream untuk konsistensi mood ink-dark,
// namun kartu kini punya hirarki visual (ikon → angka besar → label kecil)
// alih-alih tumpukan datar. Ikon gold agar selaras dengan angka serif gold.
export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section aria-label="Statistik MAU'S Kitchen" className="bg-brown-deep py-7 text-cream md:py-9">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4 md:gap-x-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <li
                key={stat.label}
                className={cn(
                  "flex flex-col items-center text-center",
                  // Divider vertikal antar kolom di md+ — kecuali kolom pertama.
                  // Dipisah ke elemen pseudo via border-l agar ringan.
                  i > 0 && "md:border-l md:border-cream/10",
                )}
              >
                <span className="mb-1.5 flex size-8 items-center justify-center rounded-full bg-gold/15 text-gold-light">
                  <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </span>
                <span className="font-serif text-xl font-bold text-gold-light md:text-3xl lg:text-4xl">
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-cream/60 md:mt-1 md:tracking-[0.14em]">
                  {stat.label}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
