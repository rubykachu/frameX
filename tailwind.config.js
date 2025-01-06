/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#64748B',    // Slate Blue
        background: '#F8FAFC', // Off White
        accent: '#0D9488',     // Soft Teal
        textColor: '#334155',  // Dark Gray
        border: '#E2E8F0',     // Subtle Border
      },
    },
  },
  plugins: [],
}

