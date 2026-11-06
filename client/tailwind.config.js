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
          deep: "#1E40AF",
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
        semantic: {
          success: "#047857",
          successSoft: "#ECFDF5",
          warning: "#B45309",
          warningSoft: "#FFFBEB",
          danger: "#BE123C",
          dangerSoft: "#FFF1F2",
        },
      },
      fontSize: {
        display: ["clamp(3rem, 5vw, 3.75rem)", { lineHeight: "1.02", letterSpacing: "-0.065em", fontWeight: "600" }],
        "heading-1": ["2.25rem", { lineHeight: "1.12", letterSpacing: "-0.055em", fontWeight: "600" }],
        "heading-2": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.04em", fontWeight: "600" }],
        "heading-3": ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.025em", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.65" }],
        caption: ["0.8125rem", { lineHeight: "1.5" }],
        micro: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.12em" }],
      },
      boxShadow: {
        card: "0 2px 8px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(37, 99, 235, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 23, 42, 0.05), 0 18px 42px rgba(37, 99, 235, 0.12)",
        glow: "0 0 0 1px rgba(37,99,235,0.08), 0 8px 28px rgba(37,99,235,0.22)",
        "glow-emerald": "0 0 32px rgba(16,185,129,0.13)",
        "surface-sm": "0 1px 2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
        "surface-md": "0 8px 24px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(37,99,235,0.04)",
        "surface-lg": "0 20px 56px rgba(15, 23, 42, 0.08), 0 6px 18px rgba(37,99,235,0.07)",
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
      borderRadius: {
        control: "0.75rem",
        card: "1rem",
        "card-lg": "1.25rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
