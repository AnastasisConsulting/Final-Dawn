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
        // "Noir Satire" Palette Overrides
        // Neutrals -> Void Scale (Deep, rich blacks)
        neutral: {
          50: '#f5f5f5',  // Text (High Contrast)
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#171717', // Borders
          900: '#0a0a0a', // Panels
          950: '#020202', // App Background
        },
        slate: {
          // Re-mapping slate to also be void-like but slightly cooler
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Accents
        cyan: {
          // "Electric Rain" - Sharper, colder
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00f0ff', // Main Holo Color
          600: '#0891b2',
          900: '#164e63',
        },
        emerald: {
          // "Radioactive/Bio-Sludge" - Sicker green
          300: '#bef264', // Lime-ish
          400: '#a3e635',
          500: '#84cc16', // Toxic Green
          600: '#65a30d',
          900: '#365314',
        },
        red: {
          // "Critical Failure"
          400: '#f87171',
          500: '#ef4444',
          900: '#7f1d1d',
          950: '#450a0a',
        },

        // Legacy Custom Names (mapped to new palette)
        'holo-cyan': '#00f0ff',
        'holo-blue': '#00a8ff',
        'holo-dark': '#0a0f14',
        'alert-orange': '#ff9f00',
        'glass-panel': 'rgba(2, 2, 2, 0.95)', // Darker glass
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
