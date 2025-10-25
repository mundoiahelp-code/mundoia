/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: { colors: { brand: { 600: "#e30613", 700: "#c60511" }, accent: { 600: "#00a1ff" } } }
  },
  plugins: [],
};
