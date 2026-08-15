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
      },
      // Animasi masuk Toast + ProductSheet (docs/08_UI_UX_SPEC.md §8.3).
      // Hormati prefers-reduced-motion lewat kelas motion-reduce:animate-none.
      keyframes: {
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
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "sheet-up": "sheet-up 250ms cubic-bezier(0.22, 1, 0.36, 1)",
        "toast-in": "toast-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
