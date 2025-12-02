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
        'ae-dark': '#0a0e17',
        'ae-darker': '#050810',
        'ae-accent': '#4ade80',
        'ae-accent-dim': '#22c55e',
        'ae-card': '#111827',
        'ae-card-hover': '#1f2937',
        'ae-border': '#1f2937',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

