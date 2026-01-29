/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'Roboto', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#6B46C1',
          dark: '#5B3AA6',
        },
        bg: {
          light: '#F7FAFC',
          soft: '#F3F4F6',
        },
        text: {
          primary: '#2D3748',
          secondary: '#718096',
        },
      },
    },
  },
  plugins: [],
}
