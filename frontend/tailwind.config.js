/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',      // slate-900
        darkCard: '#1e293b',    // slate-800
        darkBorder: '#334155',  // slate-700
      },
    },
  },
  plugins: [],
}
