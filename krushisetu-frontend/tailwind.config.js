/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f7fb",
          100: "#e9eef6",
          200: "#d5dfee",
          300: "#b3c4dd",
          400: "#88a1c5",
          500: "#5d7ca9",
          600: "#45618a",
          700: "#374c6b",
          800: "#2a3a53",
          900: "#1c2637"
        }
      },
      boxShadow: {
        soft: "0 24px 80px rgba(15, 23, 42, 0.10)",
        glow: "0 20px 60px rgba(16, 185, 129, 0.25)"
      }
    },
  },
  plugins: [],
}
