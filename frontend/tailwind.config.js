/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFF0EA',
          100: '#FFD9C8',
          200: '#FFB59A',
          300: '#FF916B',
          400: '#FF7D52',
          500: '#FF6B35',
          600: '#E5551E',
          700: '#B5411A',
          800: '#7E2D11',
          900: '#4D1B0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
