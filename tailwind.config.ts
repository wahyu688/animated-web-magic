import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      // Type scale from the Foundations page: [size, { lineHeight, letterSpacing, fontWeight }]
      fontSize: {
        display: ["68px", { lineHeight: "72px", letterSpacing: "-0.035em", fontWeight: "700" }],
        h1: ["48px", { lineHeight: "54px", letterSpacing: "-0.03em", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "42px", letterSpacing: "-0.025em", fontWeight: "700" }],
        "page-title": ["26px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["22px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "card-title": ["16px", { lineHeight: "24px", letterSpacing: "-0.008em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", letterSpacing: "-0.004em" }],
        body: ["15px", { lineHeight: "22px", letterSpacing: "-0.002em" }],
        label: ["13px", { lineHeight: "18px", fontWeight: "600" }],
        small: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px", letterSpacing: "0.002em" }],
        micro: ["11px", { lineHeight: "16px" }],
        kpi: ["28px", { lineHeight: "34px", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      colors: {
        border: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
        },
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        subtle: token("subtle"),
        track: token("track"),
        amber: token("amber"),
        tooltip: {
          DEFAULT: token("tooltip"),
          foreground: token("tooltip-foreground"),
        },
        brand: {
          50: "#eef3ff",
          100: "#dce6ff",
          200: "#b6caff",
          300: "#84a5fb",
          400: "#4d7af0",
          500: "#2a5de6",
          600: "#0a48de",
          700: "#083bb8",
          800: "#072f91",
          900: "#061f5c",
        },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
          soft: token("primary-soft"),
          text: token("primary-text"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
          soft: token("destructive-soft"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        surface: {
          DEFAULT: token("surface"),
          foreground: token("surface-foreground"),
          2: token("surface-2"),
        },
        success: {
          DEFAULT: token("success"),
          foreground: token("success-foreground"),
          soft: token("success-soft"),
        },
        warning: {
          DEFAULT: token("warning"),
          foreground: token("warning-foreground"),
          soft: token("warning-soft"),
        },
        info: {
          DEFAULT: token("info"),
          foreground: token("info-foreground"),
          soft: token("info-soft"),
        },
        violet: {
          DEFAULT: token("violet"),
          foreground: token("violet-foreground"),
          soft: token("violet-soft"),
        },
        sidebar: {
          DEFAULT: token("sidebar-background"),
          foreground: token("sidebar-foreground"),
          primary: token("sidebar-primary"),
          "primary-foreground": token("sidebar-primary-foreground"),
          accent: token("sidebar-accent"),
          "accent-foreground": token("sidebar-accent-foreground"),
          border: token("sidebar-border"),
          ring: token("sidebar-ring"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-xs)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.97)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "loading-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        "loading-bar": "loading-bar 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
