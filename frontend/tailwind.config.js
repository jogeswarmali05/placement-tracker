/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { 950: '#0f1a30', 900: '#14213d', 800: '#1d2c50', 700: '#2a3b66', 300: '#a9b6d3' },
        mist: '#f3f6f9',
      },
    },
  },
  plugins: [],
};
