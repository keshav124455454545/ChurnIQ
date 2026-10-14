/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--theme-bg)',
          card: 'var(--theme-card)',
          cardSub: 'var(--theme-card-sub)',
          border: 'var(--theme-border)',
          hover: 'var(--theme-hover)',
          text: 'var(--theme-text)',
          muted: 'var(--theme-muted)',
        },
        accent: {
          emerald: '#10B981',
          mint: '#34D399',
          darkEmerald: '#059669',
          amber: '#F59E0B',
          rose: '#F43F5E',
          teal: '#14B8A6',
        },
        obsidian: {
          700: '#1e293b',
          750: '#161f33',
          800: '#0f172a',
          850: '#0b1120',
          900: '#080d1a',
          950: '#040711',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
