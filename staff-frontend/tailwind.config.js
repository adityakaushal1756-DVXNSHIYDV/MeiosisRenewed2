/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mist: '#E2E2E2',
        ink: '#0A0A0B'
      }
    },
  },
  plugins: [],
}
