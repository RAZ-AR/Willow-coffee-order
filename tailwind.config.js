/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: '#14b8a6', // Willow brand color (teal-500)
      },
    },
  },
  plugins: [],
};
