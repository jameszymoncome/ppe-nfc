/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lgu-blue': '#1e40af',
        'lgu-gold': '#fbbf24',
      }
    },
  },
  plugins: [],
}