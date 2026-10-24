/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#060911',
          900: '#0B0F19',
          800: '#111827',
          700: '#1F293D'
        }
      }
    },
  },
  plugins: [],
}
