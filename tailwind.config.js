/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    borderRadius: { none: "0", sm: "2px", DEFAULT: "3px", md: "4px", lg: "4px", full: "9999px" },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        sheet: "rgb(var(--sheet) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        stamp: "rgb(var(--stamp) / <alpha-value>)",
        pine: "rgb(var(--pine) / <alpha-value>)",
        ochre: "rgb(var(--ochre) / <alpha-value>)",
        graphite: "rgb(var(--graphite) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
