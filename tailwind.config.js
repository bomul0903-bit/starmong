/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    // Tier colors used dynamically via tierColors map
    ...['emerald','teal','sky','blue','indigo','violet','amber','orange','rose'].flatMap(c => [
      `bg-${c}-500/10`, `border-${c}-500/30`, `text-${c}-400`,
    ]),
  ],
  theme: {
    extend: {
      animation: {
        twinkle: 'twinkle var(--twinkle-duration, 3s) ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
