import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coral: "#FF6B6B",
        yellow: "#FFD93D",
        navy: "#1A1A2E",
        charcoal: "#16213E",
        "text-secondary": "#B4B4B8",
      },
      fontFamily: {
        sans: ["'Poppins'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
