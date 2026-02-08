/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      animation: {
        twinkle: 'twinkle var(--twinkle-duration, 3s) ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
