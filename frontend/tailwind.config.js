/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef0ff',
          100: '#dde1ff',
          200: '#bcc4ff',
          300: '#95a0ff',
          400: '#6b77ff',
          500: '#4f52ff',
          600: '#4338e8',
          700: '#3a2ec1',
          800: '#2f2899',
          900: '#231e6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -15px rgba(17, 24, 39, 0.15)',
      },
    },
  },
  plugins: [],
};
