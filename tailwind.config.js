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
        // EXACT BRAND COLOR PALETTE REQUESTED BY USER
        emerald: {
          950: '#102A25', // Dark
          900: '#064E3B', // Primary Deep Emerald
          800: '#0B5E48',
          700: '#0F766E', // Secondary Teal
        },
        primary: '#064E3B',
        secondary: '#0F766E',
        gold: {
          DEFAULT: '#D4AF37', // Royal Gold
          light: '#F4D06F', // Light Gold
          dark: '#B8860B',
          50: '#FDFBF4',
          100: '#FAF4DC',
          200: '#F4E7B4',
          300: '#F4D06F',
          400: '#D4AF37',
          500: '#C59E27',
          600: '#B8860B',
        },
        ivory: {
          DEFAULT: '#FFF9EC',
          50: '#FFFFFF',
          100: '#FFFDF7',
          200: '#FFF9EC',
          300: '#FBF2DD',
          400: '#F5E6C4',
        },
        dark: '#102A25',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 2px 10px rgba(212, 175, 55, 0.18)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 12px 30px rgba(212, 175, 55, 0.3)',
      }
    },
  },
  plugins: [],
};
