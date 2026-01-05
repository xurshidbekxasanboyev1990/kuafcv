/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#991B1B',
          600: '#991B1B',
          700: '#991B1B',
          800: '#991B1B',
          900: '#7f1d1d',
        },
        gray: {
          50: '#F2F3F5',
          100: '#F2F3F5',
        },
      },
    },
  },
  plugins: [],
};
