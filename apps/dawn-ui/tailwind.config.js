// PATH: Eideus_Merger/apps/dawn-ui/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './hooks/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
    '../sim_viz/components/**/*.{ts,tsx,js,jsx}',
    '../sim_viz/App.tsx',
    '../sim_viz/constants.ts',
    '../sim_viz/lore_data.ts',
    '../sim_viz/types.ts',
  ],
  theme: {
    extend: {
      colors: {
        'holo-cyan': '#00f0ff',
        'holo-blue': '#00a8ff',
        'holo-dark': '#0a0f14',
        'alert-orange': '#ff9f00',
        'glass-panel': 'rgba(10, 20, 30, 0.85)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
