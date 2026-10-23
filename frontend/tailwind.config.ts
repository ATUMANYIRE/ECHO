import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "surface-subtle": "#F7F7F5",
        "surface-muted": "#F0F0EC",
        "text-primary": "#20252D",
        "text-secondary": "#707782",
        "text-muted": "#9CA3AF",
        border: "#E8E9E6",
        "border-subtle": "#F0F0EE",
        canvas: {
          50: "#FAFAF8",
          100: "#F5F5F0",
          200: "#EAEAE3",
          300: "#D8D8CF",
          800: "#242426",
          900: "#18181B",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
        },
        accent: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
        },
        success: {
          DEFAULT: "#16805D",
          50: "#F0FDF4",
          100: "#DCFCE7",
          600: "#16805D",
          700: "#136C4E",
        },
        error: {
          DEFAULT: "#D34A4A",
          50: "#FEF2F2",
          100: "#FEE2E2",
          600: "#D34A4A",
          700: "#B93838",
        },
      },
      fontFamily: {
        mono: [
          "var(--font-geist-mono)",
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "monospace",
        ],
        sans: [
          "var(--font-geist-sans)",
          "Geist",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
