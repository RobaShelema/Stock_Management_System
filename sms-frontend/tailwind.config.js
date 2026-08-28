/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2f8",
          100: "#d6e0ee",
          200: "#adc1dd",
          300: "#7f9bc7",
          400: "#5878ac",
          500: "#3d5c93",
          600: "#2e4877",
          700: "#243a60",
          800: "#1f3864",
          900: "#152544",
          950: "#10203a",
        },
        clay: {
          50: "#fff4ef",
          100: "#fce4d8",
          200: "#f6c5b0",
          300: "#e99a7b",
          500: "#c26a3f",
          600: "#a8552f",
          700: "#8c4327",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
