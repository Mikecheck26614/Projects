/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': 'var(--primary-blue, #222366)',
        'primary-yellow': 'var(--primary-yellow, #f7d154)',
        'light-gray': 'var(--light-gray, #e5e7eb)',
      },
    },
  },
  plugins: [],
};