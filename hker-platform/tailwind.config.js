/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hker: {
          ink: '#0b0908',
          charcoal: '#181310',
          lacquer: '#a11423',
          'lacquer-dark': '#6e0e18',
          gold: '#c9a227',
          'gold-light': '#e6c65c',
          jade: '#3f8f75',
          stone: '#a89a86',
          'stone-dark': '#5c5248',
        },
      },
      fontFamily: {
        display: ['"Noto Serif TC"', 'serif'],
        body: ['"Noto Sans TC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
