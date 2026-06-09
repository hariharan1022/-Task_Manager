/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          light: "#F3E8FF",
          dark: "#5B21B6",
        },
        secondary: {
          DEFAULT: "#9333EA",
          light: "#FAF5FF",
        },
        accent: {
          DEFAULT: "#A855F7",
          light: "#F5F3FF",
        },
        silver: {
          DEFAULT: "#94A3B8",
          light: "#F1F5F9",
          dark: "#64748B",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        ink: "#0F172A",
        surface: "#F8FAFC",
        border: "#E2E8F0",
        muted: "#94A3B8",
        text: {
          primary: "#1E293B",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.04), 0 4px 20px rgba(124,58,237,.08)",
        glow: "0 10px 40px -10px rgba(124,58,237,.55)",
        "glow-lg": "0 20px 50px -15px rgba(147,51,234,.45)",
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #7C3AED 0%, #9333EA 45%, #C084FC 100%)",
        "gradient-soft":
          "linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 50%, #F8FAFC 100%)",
        "gradient-dark":
          "linear-gradient(160deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        slideIn: "slideIn 0.25s ease-out",
        slideInRight: "slideInRight 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        fadeIn: "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
