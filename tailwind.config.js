/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',       // Indigo 600
        'primary-dark': '#4338ca', // Indigo 700
        'primary-light': '#e0e7ff', // Indigo 100
        secondary: '#0891b2',     // Cyan 600
        'secondary-dark': '#0e7490', // Cyan 700
        'secondary-light': '#cffafe', // Cyan 100
        background: '#F8FAFC',    // Slate 50
        textColor: '#0f172a',     // Slate 900
        border: '#E2E8F0',        // Subtle Border
        accent: '#6366f1',        // Indigo 500
      },
    },
  },
  plugins: [],
}
