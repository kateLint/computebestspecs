import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic surfaces & text mapped to CSS variables
        surface: {
          main: "var(--bg-main)",
          secondary: "var(--bg-secondary)",
          card: "var(--card-main)",
          elevated: "var(--card-elevated)",
          subtle: "var(--card-subtle)",
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        content: {
          strong: "var(--text-strong)",
          body: "var(--text-body)",
          muted: "var(--text-muted)",
        },

        // Day/Night Palettes
        day: {
          bg: "#FFFEFC",
          secondary: "#F6F3EE",
          card: "#FFFEFC",
          elevated: "#F0F2F1",
          subtle: "#F6F3EE",
          textStrong: "#22324A",
          textBody: "#536783",
          textMuted: "#7D8CA3",
          border: "#D7E1EA",
          borderStrong: "#C3D1DF",
          primary: "#126BD6",
          cyan: "#1689A8",
          violet: "#7046D9",
          accentSelection: "#FF761A",
          success: "#059669",
          warning: "#D97706",
          error: "#DC2626",
          blueEmphasis: "#EFF6FF",
          violetEmphasis: "#F5F3FF",
          greenEmphasis: "#ECFDF5",
          amberEmphasis: "#FFFBEB",
        },

        night: {
          bg: "#0B0F17",
          secondary: "#101620",
          card: "#151C27",
          elevated: "#192231",
          subtle: "#121924",
          textStrong: "#F8FAFC",
          textBody: "#B7C2D0",
          textMuted: "#778499",
          border: "#263244",
          borderStrong: "#334155",
          primary: "#60A5FA",
          cyan: "#22D3EE",
          violet: "#A78BFA",
          success: "#34D399",
          warning: "#FBBF24",
          error: "#FB7185",
        },

        // Brand colors
        brand: {
          primary: "var(--brand-primary)",
          cyan: "var(--brand-cyan)",
          violet: "var(--brand-violet)",
          blue: "var(--brand-primary)",
        },

        // Accent colors
        accent: {
          selection: "var(--accent-selection)",
        },

        // Semantic status colors
        semantic: {
          success: "var(--semantic-success)",
          warning: "var(--semantic-warning)",
          critical: "var(--semantic-critical)",
          unknown: "var(--semantic-unknown)",
        },

        // Consistent Resource colors
        resource: {
          cpu: "var(--res-cpu)",
          gpu: "var(--res-gpu)",
          ram: "var(--res-ram)",
          vram: "var(--res-vram)",
          storage: "var(--res-storage)",
          platform: "var(--res-platform)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, var(--brand-cyan) 0%, var(--brand-primary) 50%, var(--brand-violet) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
