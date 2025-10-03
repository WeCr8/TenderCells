/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#fefdf6',
          100: '#fefaec',
          200: '#fcf2d0',
          300: '#f9e6a8',
          400: '#f4d178',
          500: '#eeb845',
          600: '#dfa53c',
          700: '#b8832f',
          800: '#94682c',
          900: '#7a5628',
        },
        earth: {
          50: '#f7f6f3',
          100: '#efede7',
          200: '#ddd9ce',
          300: '#c6bfab',
          400: '#aca188',
          500: '#968a6f',
          600: '#847762',
          700: '#6e6052',
          800: '#5a5047',
          900: '#49423a',
        },
        sage: {
          50: '#f6f8f6',
          100: '#e8f1ea',
          200: '#d3e3d6',
          300: '#b3ccb8',
          400: '#8fb197',
          500: '#6d927a',
          600: '#557862',
          700: '#456151',
          800: '#3a4f43',
          900: '#324239',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
};