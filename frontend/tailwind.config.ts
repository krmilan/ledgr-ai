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
        // Ledgr.ai brand colors — used throughout the app
        background: {
          primary: "#0a0a0f",    // main dark background
          secondary: "#111118",  // card backgrounds
          tertiary: "#1a1a24",   // hover states, borders
        },
        emerald: {
          // Override Tailwind's default emerald with our brand green
          400: "#34d399",
          500: "#10b981",        // primary accent
          600: "#059669",
        },
        border: "#1e1e2e",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;