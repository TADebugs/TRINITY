/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#4A90D9',
          purple: '#9B59B6',
          green: '#27AE60',
          pink: '#DA5194',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        overpass: ['Overpass', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
