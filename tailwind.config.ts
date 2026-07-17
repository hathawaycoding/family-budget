import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ledger: {
          ink: "#111827",
          paper: "#f7f1e3",
          dusk: "#121520",
          panel: "#1b2130",
          ruled: "#3d465c",
          amber: "#f5b84b",
          mint: "#7dd3a7",
          rose: "#ef6f6c",
          blue: "#79a7ff",
          violet: "#b48cff"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        sheet: "0 24px 70px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
