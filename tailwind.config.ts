import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "360px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F7EEE4",
          soft: "#FBF6F0",
        },
        brown: {
          DEFAULT: "#5C3A24",
          deep: "#3E2318",
        },
        gold: {
          DEFAULT: "#C79A4B",
          light: "#E3C489",
        },
        rose: {
          DEFAULT: "#E8AFA4",
        },
        ink: {
          DEFAULT: "#0F0F0F",
          soft: "#1C1B19",
        },
        chili: {
          DEFAULT: "#D62828",
        },
        flame: {
          DEFAULT: "#F4B01A",
        },
        choco: {
          DEFAULT: "#2A1A12",
          mid: "#6B4226",
        },
        berry: {
          DEFAULT: "#C0392B",
        },
        pistachio: {
          DEFAULT: "#8A9A3B",
        },
        success: {
          DEFAULT: "#2E7D32",
        },
        warning: {
          DEFAULT: "#ED8936",
        },
        danger: {
          DEFAULT: "#C53030",
        },
        info: {
          DEFAULT: "#2B6CB0",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        display: ["var(--font-bebas)", "sans-serif"],
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        warm: "0 4px 20px rgba(62, 35, 24, 0.08)",
        "warm-lg": "0 18px 50px rgba(62, 35, 24, 0.16)",
        // Skeleton halus agar loading state tidak berdebar (docs/08 §8.9).
        skeleton: "0 1px 2px rgba(62, 35, 24, 0.06)",
      },
      // Token z-index terpadu — sumber nilai CSS var di globals.css :root.
      // Pakai z-base/z-dropdown/z-fab/z-sticky/z-toast/z-dialog, BUKAN angka
      // mentah yang rawan bentrok. (upgrade Batch 1, A4).
      zIndex: {
        base: "var(--z-base)",
        dropdown: "var(--z-dropdown)",
        fab: "var(--z-fab)",
        sticky: "var(--z-sticky)",
        toast: "var(--z-toast)",
        dialog: "var(--z-dialog)",
      },
      // Permukaan semantik (docs/06). Mengalihkan dari hex ad-hoc ke token.
      backgroundColor: {
        page: "var(--surface-page)",
        surface: "var(--surface)",
        "surface-strong": "var(--surface-strong)",
        "surface-ink": "var(--surface-ink)",
        "surface-ink-soft": "var(--surface-ink-soft)",
        "surface-choco": "var(--surface-choco)",
      },
      // Animasi masuk Toast + ProductSheet (docs/08_UI_UX_SPEC.md §8.3).
      // Hormati prefers-reduced-motion lewat kelas motion-reduce:animate-none
      // (dan jaring pengaman global di globals.css).
      keyframes: {
        // Accordion (Radix + shadcn approach, src/components/ui/Accordion.tsx).
        // Radix menyimpan tinggi konten di var --radix-accordion-content-height;
        // kita animasikan dari 0 ke nilai itu (dan sebaliknya) lewat keyframe
        // CSS — lebih andal lintas browser daripada motion height:auto.
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "drawer-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        // Reveal section/hero: fade + 8px up, sekali saja (docs/08 §4 motion).
        reveal: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Halo denyut untuk langkah timeline yang sedang aktif (status pesanan).
        // Ambient loop paling lambat yang masih terbaca; dimatikan otomatis oleh
        // jaring pengaman prefers-reduced-motion di globals.css.
        halo: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0", transform: "scale(1.75)" },
        },
        // Kilau emas menyapu satu kali pada panel TOTAL — aksen premium, bukan loop.
        sheen: {
          from: { transform: "translateX(-120%)" },
          to: { transform: "translateX(220%)" },
        },
        // Zoom napas lambat (ambient, bukan hover) untuk foto hero — gerak
        // khas premium yang halus; dimatikan motion-safe + jaring reduce.
        kenburns: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        // Kartu pesanan admin (docs/14 §14.2): key kartu menyertakan status,
        // jadi perubahan status/pesanan baru me-remount <li> dan memutar
        // animasi ini — flash emas menandai kartu mana yang berubah di tengah
        // auto-refresh 30 detik. card-flash tanpa keyframe "to" agar kembali
        // ke warna latar alami kartu (cream-soft / flame/5).
        "card-enter": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "card-flash": {
          from: { backgroundColor: "rgba(199, 154, 75, 0.22)" },
        },
        "flame-once": {
          from: { boxShadow: "0 0 0 3px rgba(244, 176, 26, 0.55)" },
          to: { boxShadow: "0 0 0 0px rgba(244, 176, 26, 0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "accordion-down": "accordion-down 0.3s ease-in-out",
        "accordion-up": "accordion-up 0.3s ease-in-out",
        "sheet-up": "sheet-up 250ms cubic-bezier(0.22, 1, 0.36, 1)",
        "toast-in": "toast-in 200ms ease-out",
        "drawer-in": "drawer-in 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        // entrance ragam emphasis (300-450ms, sekali). Konsumen wajib menambah
        // motion-reduce:animate-none bila dipakai pada LCP.
        reveal: "reveal 350ms cubic-bezier(0.22, 1, 0.36, 1) both",
        halo: "halo 2600ms ease-out infinite",
        sheen: "sheen 1400ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both",
        kenburns: "kenburns 22s ease-in-out infinite",
        // Kartu admin: update = slide masuk + flash; pesanan BARU tambah
        // denyut outline flame sekali (jaring reduce mematikan otomatis).
        "card-update":
          "card-enter 300ms cubic-bezier(0.22, 1, 0.36, 1) both, card-flash 800ms ease-out",
        "card-new":
          "card-enter 300ms cubic-bezier(0.22, 1, 0.36, 1) both, card-flash 800ms ease-out, flame-once 700ms ease-out 100ms",
      },
    },
  },
  plugins: [],
};

export default config;
