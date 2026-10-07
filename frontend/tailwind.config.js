/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastelPink: '#f3b6cf',
        primaryPink: '#ed458b',
        skyBlue: '#82d1f4',
        butterYellow: '#fdf6af',
        softCyan: '#a2def8',
      },
    },
  },
  plugins: [],
};
