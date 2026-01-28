/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B46C1',
        'primary-dark': '#5a3ba3',
        background: '#121212',
        surface: '#1E1E1E',
        'surface-light': '#2A2A2A',
      },
    },
  },
  plugins: [],
}
