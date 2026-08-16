/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        masjid: {
          50: '#f2f9f4',
          100: '#e1f2e5',
          200: '#c5e4cd',
          300: '#9bcfaa',
          400: '#6bb381',
          500: '#46965f',
          600: '#347a4b',
          700: '#2b613e',
          800: '#254e34',
          900: '#1e412c',
          950: '#0e2418',
        },
        gold: {
          50: '#fbf8eb',
          100: '#f5eecc',
          200: '#ecdc99',
          300: '#e1c45f',
          400: '#d7ab32',
          500: '#be8f25',
          600: '#a06e1d',
          700: '#7f501b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
