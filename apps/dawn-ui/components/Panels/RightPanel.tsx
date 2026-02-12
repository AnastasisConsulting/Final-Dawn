/**
 * UI STABILITY WARNING: 
 * This component is part of the established "High-Density / Professional Sleek" UI standard.
 * DO NOT modify the dock width (50px), font sizes (text-[8px]), or layout proportions.
 */
// Final_Dawn_of_Eideus/apps/dawn-ui/components/Panels/RightPanel.tsx

import React from 'react';

import { useColorStealing } from '../../src/contexts/ColorStealingContext';

interface RightPanelProps {
  activePanel?: string | null;
  onPanelSelect?: (id: string) => void;
  devTerminalOpen: boolean;
  setDevTerminalOpen: (open: boolean) => void;
}

import { useGame } from '../../src/context/GameContext';
import { DevTerminal } from '../Features/Dev/DevTerminal';

// ...

export const RightPanel: React.FC<RightPanelProps> = ({
  activePanel,
  onPanelSelect,
  devTerminalOpen,
  setDevTerminalOpen
}) => {
  const { state: gameState } = useGame();
  const { panelColors } = useColorStealing();
  const rightColor = panelColors.right;

  const charName = gameState.identity.name || 'UNKNOWN'; // Assuming name exists in identity or we need to add it

  const BUTTONS = [
    { id: 'UNIT', label: charName.toUpperCase() }, // Dynamic Character Name
    { id: 'SKILLS', label: 'SKILLS' },
    { id: 'PROG', label: 'PROG' },
    { id: 'INV', label: 'INV' },
    { id: 'OPT', label: 'CONFIG' }, // Renamed from OPT
  ];

  return (
    <div className={`
        h-full w-full bg-[#0a0a0a]/70 backdrop-blur-sm p-0.5 flex flex-col shadow-2xl z-30 relative gap-1 transition-all duration-300
        ${rightColor.stolen
        ? 'border border-neutral-800 hover:bg-[#111]/80 hover:border-neutral-700'
        : 'border border-fuchsia-500/30 hover:bg-[#111]/80 hover:border-fuchsia-500/50 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)]'
      }
    `}>
      {/* Standard System Buttons */}
      {BUTTONS.map((btn) => {
        const isActive = activePanel === btn.id;
        return (
          <button
            key={btn.id}
            onClick={() => onPanelSelect && onPanelSelect(btn.id)}
            className={`
              flex-1 relative transition-all duration-200 group border
              flex items-center justify-center
              ${isActive
                ? 'bg-neutral-800 border-neutral-600 text-neutral-200 shadow-[inset_0_2px_5px_rgba(255,255,255,0.05)] translate-y-[1px]'
                : 'bg-[#0f0f0f] border-black text-neutral-600 shadow-[0_2px_0_black] hover:bg-neutral-800 hover:border-neutral-500 hover:text-neutral-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5'
              }
            `}
          >
            {/* LED Status Light */}
            <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-orange-500 shadow-[0_0_5px_orange]' : 'bg-neutral-900 group-hover:bg-neutral-600'}`} />

            <span className="writing-mode-vertical text-[8px] font-bold tracking-[0.2em] uppercase text-shadow-sm mt-1" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              {btn.label}
            </span>

            {/* Tactile Texture */}
            {!isActive && <div className="absolute bottom-0 h-1 w-full bg-black/50" />}

            {/* Hover Glow Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        );
      })}

      {/* Dev Terminal Slot */}
      {devTerminalOpen && (
        <div className="flex-[2] mt-2 border-t border-fuchsia-900/40 pt-2 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[8px] font-bold text-fuchsia-400 tracking-widest uppercase">Dev_Link</span>
            <button onClick={() => setDevTerminalOpen(false)} className="text-[10px] text-neutral-600 hover:text-white">×</button>
          </div>
          <div className="flex-1 bg-black/60 rounded border border-fuchsia-500/20 overflow-hidden relative">
            {/* We use a specialized view of the terminal here */}
            <div className="absolute inset-0 scale-[0.75] origin-top-left w-[133%] h-[133%]">
              <DevTerminal open={true} onClose={() => setDevTerminalOpen(false)} embedded={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
