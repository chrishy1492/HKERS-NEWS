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
          red: '#b91c2c',
          'red-dark': '#7a1420',
          gold: '#d4af37',
          'gold-light': '#e8cd6f',
          ink: '#0c0a08',
          charcoal: '#17130f',
        },
      },
      fontFamily: {
        display: ['"Noto Serif TC"', '"Microsoft JhengHei"', 'serif'],
      },
    },
  },
  plugins: [],
}
