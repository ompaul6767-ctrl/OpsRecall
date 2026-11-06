/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: "#0F172A",
        surface: "#FFFFFF",
        panel: "#F8FAFC",
        line: "#E2E8F0",
        navy: "#0B1B3A",
        brand: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
          soft: "#DBEAFE",
          tint: "#BFDBFE",
        },
        sky: {
          DEFAULT: "#0EA5E9",
          light: "#F0F9FF",
          soft: "#E0F2FE",
        },
        accent: {
          blue: "#2563EB",
          sky: "#0EA5E9",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
      },
      boxShadow: {
        card: "0 8px 30px rgba(37,99,235,0.08)",
        "card-hover": "0 14px 36px rgba(37,99,235,0.13)",
        glow: "0 0 36px rgba(37,99,235,0.18)",
        "glow-emerald": "0 0 32px rgba(16,185,129,0.13)",
      },
      keyframes: {
        "aurora-drift": { "0%": { transform: "translate3d(-1%,0,0) scale(1)" }, "100%": { transform: "translate3d(2%,1.5%,0) scale(1.04)" } },
        "skeleton-shimmer": { to: { backgroundPosition: "-220% 0" } },
        "pulse-ring": { "0%,100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0)" }, "50%": { boxShadow: "0 0 0 8px rgba(16,185,129,0.12)" } },
      },
      animation: {
        aurora: "aurora-drift 28s ease-in-out infinite alternate",
        shimmer: "skeleton-shimmer 1.6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
      },
      borderRadius: { "4xl": "2rem" },
    },
  },
  plugins: [],
};
