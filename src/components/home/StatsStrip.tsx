import { CountUp } from "@/components/common/CountUp";

interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-brown-deep py-6 text-cream md:py-8">
      <div className="mx-auto w-full max-w-content px-4 md:px-8">
        <div className="grid grid-cols-4 gap-2 md:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <CountUp
                end={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="font-serif text-xl font-bold text-gold-light md:text-3xl lg:text-4xl"
              />
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cream/55 md:mt-1 md:text-[11px] md:tracking-[0.14em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
