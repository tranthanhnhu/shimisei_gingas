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
      }
    },
  },
  plugins: [],
}
