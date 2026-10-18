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
        ibm: {
          blue: '#0f62fe',
          cyan: '#1192e8',
          dark: '#161616',
          darker: '#0a0a0a'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
