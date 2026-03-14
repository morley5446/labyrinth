/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        wood: {
          light: '#c8a96e',
          DEFAULT: '#8b5e3c',
          dark: '#5c3a1e',
        },
        gold: {
          light: '#f9e08b',
          DEFAULT: '#d4a017',
          dark: '#9a6f00',
        },
        forest: {
          light: '#4a7c59',
          DEFAULT: '#2d5a3d',
          dark: '#1a3a25',
        },
      },
      fontFamily: {
        fairy: ['"MedievalSharp"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
