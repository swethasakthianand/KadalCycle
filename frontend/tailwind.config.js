/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Mukta Malar', 'Inter', 'system-ui', 'sans-serif'],
        tamil: ['"Mukta Malar"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'ocean-void': '#020617',
        'ocean-deep': '#0b1326',
        'surface-dark': '#0f172a',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'surface-glass': 'rgba(15, 23, 42, 0.65)',
        'border-glow': 'rgba(14, 165, 233, 0.2)',
        'emerald-glow': 'rgba(16, 185, 129, 0.15)',
        primary: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
          dim: '#89ceff',
        },
        secondary: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
          dim: '#4edea3',
        },
        tertiary: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
          dim: '#ffb86e',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'cyan-glow': '0 0 20px -3px rgba(14, 165, 233, 0.25)',
        'emerald-glow': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'amber-glow': '0 0 20px -3px rgba(245, 158, 11, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};