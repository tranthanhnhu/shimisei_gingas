/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./404.html",
    "./script.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Noto Sans JP', 'sans-serif'],
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'float': 'float 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
