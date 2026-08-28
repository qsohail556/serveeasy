/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E4572E', // warm food-appropriate orange — swap in design.md's final pick
      },
    },
  },
  plugins: [],
};
