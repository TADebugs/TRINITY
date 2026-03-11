/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@relume_io/relume-ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("@relume_io/relume-tailwind")],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Overpass", "sans-serif"],
      },
      colors: {
        brand: {
          blue: "#4A90D9",
          purple: "#9B59B6",
          green: "#27AE60",
          pink: "#DA5194",
          peach: "#FACFCA",
          spindle: "#BDD6F0",
          olive: "#BBB39A",
        },
        surface: {
          DEFAULT: "#111111",
          light: "#1a1a1a",
          card: "#1e1e1e",
        },
      },
    },
  },
};
