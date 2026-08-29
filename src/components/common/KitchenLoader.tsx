import { cn } from "@/lib/utils";

interface KitchenLoaderProps {
  /** Teks kontekstual, mis. "Memuat menu" — elipsis animatif ditambah otomatis. */
  label: string;
  className?: string;
}

/*
 * Loader kreatif "panci dapur": uap berketak tiga, sup dengan gelembung
 * yang membesar lalu pop. Animasinya murni CSS (lihat .kitchen-* di
 * globals.css) sehingga langsung bergerak pada first paint loading.tsx —
 * sebelum bundle JavaScript termuat. Warna memakai token brand supaya
 * konsisten dengan sistem visual. Server component: tanpa "use client".
 */
export function KitchenLoader({ label, className }: KitchenLoaderProps) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 96 78"
        className="h-20 w-24 text-brown-deep"
      >
        {/* Uap */}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-gold-light"
        >
          <path
            className="kitchen-steam"
            opacity=".55"
            d="M34 28c-4-4 4-8 0-12-2.5-2.5.5-5 0-8"
          />
          <path
            className="kitchen-steam kitchen-steam-2"
            opacity=".55"
            d="M48 26c-4-5 4-9 0-14-2.5-2.5.5-5 0-7"
          />
          <path
            className="kitchen-steam kitchen-steam-3"
            opacity=".55"
            d="M62 28c-4-4 4-8 0-12-2.5-2.5.5-5 0-8"
          />
        </g>

        {/* Pegangan panci */}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-brown"
        >
          <path d="M15 46q-7 6 0 12" />
          <path d="M81 46q7 6 0 12" />
        </g>

        {/* Badan panci */}
        <path
          fill="currentColor"
          d="M18 40h60v12a13 13 0 0 1-13 13H31a13 13 0 0 1-13-13z"
        />

        {/* Bibir panci + permukaan sup */}
        <ellipse
          cx="48"
          cy="40"
          rx="30"
          ry="6.5"
          className="fill-ink-soft stroke-gold"
          strokeWidth="2"
        />
        <ellipse cx="48" cy="40" rx="25" ry="4" className="fill-gold-light/60" />

        {/* Gelembung sup */}
        <g className="fill-gold-light">
          <circle className="kitchen-bubble" cx="40" cy="37" r="2.4" />
          <circle
            className="kitchen-bubble kitchen-bubble-2"
            cx="52"
            cy="36"
            r="1.9"
          />
          <circle
            className="kitchen-bubble kitchen-bubble-3"
            cx="58"
            cy="38"
            r="1.5"
          />
        </g>
      </svg>

      <p className="text-sm font-semibold text-brown/80">
        {label}
        <span aria-hidden="true" className="tabular-nums">
          <span className="kitchen-dot">.</span>
          <span className="kitchen-dot kitchen-dot-2">.</span>
          <span className="kitchen-dot kitchen-dot-3">.</span>
        </span>
      </p>
    </div>
  );
}
