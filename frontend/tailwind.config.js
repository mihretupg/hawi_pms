/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf7",
          100: "#d6f5ed",
          500: "#10b981",
          700: "#047857",
          900: "#064e3b"
        }
      }
    },
  },
  plugins: [],
};
