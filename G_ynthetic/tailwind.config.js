/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", 
    "./ui/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    // Add this line to ensure it scans your root files if they are not in src
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Share Tech Mono"', 'sans-serif'], // Optional: Using Tech Mono as sans for this sci-fi vibe
      },
      colors: {
        // Custom palette matches your UI (Cyan/Purple/Black)
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          900: '#164e63',
          950: '#083344',
        },
        neutral: {
          900: '#171717',
          950: '#0a0a0a',
        }
      }
    },
  },
  plugins: [],
}