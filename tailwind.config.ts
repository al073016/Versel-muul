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
        // === MUUL "INTELLIGENT CURATOR" DESIGN SYSTEM ===
        // Surfaces (Light mode — paper-like layering)
        "surface":                  "#f8f9ff",
        "surface-dim":              "#d7d9e4",
        "surface-bright":           "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low":    "#f1f5f9",
        "surface-container":        "#f8f9ff",
        "surface-container-high":   "#ffffff",
        "surface-container-highest":"#f1f5f9",
        "surface-variant":          "#e0e2ec",
        "background":               "#f8f9ff",

        // Primary (Deep Blue — editorial authority)
        "primary":                  "#003e6f",
        "primary-container":        "#005596",
        "primary-fixed":            "#cde5ff",
        "primary-fixed-dim":        "#94ccff",
        "on-primary":               "#ffffff",
        "on-primary-container":     "#ffffff",
        "on-primary-fixed":         "#001d33",
        "on-primary-fixed-variant": "#004578",
        "inverse-primary":          "#94ccff",

        // Secondary (Coppel Yellow — intelligent highlight)
        "secondary":                "#fed000",
        "secondary-container":      "#fef08a",
        "secondary-fixed":          "#ffe24c",
        "secondary-fixed-dim":      "#e0c600",
        "on-secondary":             "#003e6f",
        "on-secondary-container":   "#201c00",
        "on-secondary-fixed":       "#201c00",
        "on-secondary-fixed-variant":"#524700",

        // Tertiary (Green — sustainability/trust)
        "tertiary":                 "#096119",
        "tertiary-container":       "#98d5a2",
        "tertiary-fixed":           "#a6f5ae",
        "tertiary-fixed-dim":       "#8ad893",
        "on-tertiary":              "#ffffff",
        "on-tertiary-container":    "#002204",
        "on-tertiary-fixed":        "#002204",
        "on-tertiary-fixed-variant":"#005313",

        // On-surface / Text
        "on-surface":               "#001c39",
        "on-surface-variant":       "#44474e",
        "on-background":            "#001c39",
        "inverse-surface":          "#2e3036",
        "inverse-on-surface":       "#eff0f7",

        // Outline
        "outline":                  "#74777f",
        "outline-variant":          "#c4c6d0",

        // Error
        "error":                    "#ba1a1a",
        "error-container":          "#ffdad6",
        "on-error":                 "#ffffff",
        "on-error-container":       "#410002",

        // Surface tint
        "surface-tint":             "#003e6f",
      },
      fontFamily: {
        headline: ["'Newsreader'", "Georgia", "serif"],
        body:     ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        label:    ["'Space Grotesk'", "monospace"],
        syne:     ["'Space Grotesk'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm:      "0.25rem",
        md:      "0.75rem",
        lg:      "1rem",
        xl:      "1.5rem",
        "2xl":   "2rem",
        full:    "9999px",
      },
      boxShadow: {
        "glow-primary":   "0 0 24px rgba(0, 62, 111, 0.12)",
        "glow-secondary": "0 0 24px rgba(254, 208, 0, 0.2)",
        "glow-tertiary":  "0 0 24px rgba(9, 97, 25, 0.15)",
        "card":           "0 4px 32px rgba(0, 28, 57, 0.06)",
        "nav":            "0 1px 12px rgba(0, 28, 57, 0.05)",
        "ambient":        "0 8px 32px rgba(0, 28, 57, 0.06)",
        "float":          "0 20px 48px rgba(0, 28, 57, 0.08)",
      },
      backgroundImage: {
        "glow-radial-primary":   "radial-gradient(circle at top right, rgba(0,62,111,0.04), transparent 50%)",
        "glow-radial-secondary": "radial-gradient(circle at bottom left, rgba(254,208,0,0.06), transparent 50%)",
        "hero-gradient":         "linear-gradient(135deg, #003e6f, #005596)",
        "cta-gradient":          "linear-gradient(135deg, #003e6f 0%, #005596 100%)",
      },
      animation: {
        "fade-in-up":   "fadeInUp 0.5s ease forwards",
        "marker-pop":   "markerPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "pulse-slow":   "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        markerPop: {
          "0%":   { transform: "scale(0)" },
          "70%":  { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;