/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        '11px': '11px',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
  darkMode: ['class', '.figma-dark']
}
