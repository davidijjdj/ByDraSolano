import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-open-sans)", "ui-sans-serif", "system-ui"],
        heading: ["var(--font-poppins)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Color de acción para CTAs principales (Agendar cita)
        cta: {
          500: "#f97316",
          600: "#ea6c0a",
          700: "#c2540a",
        },
        // Fondo general de la app
        surface: "#F8FAFC",
      },
    },
  },
  plugins: [],
};

export default config;
