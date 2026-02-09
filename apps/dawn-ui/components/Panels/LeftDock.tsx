import React from 'react';
import { useColorStealing } from '../../src/contexts/ColorStealingContext';
import { useKernel } from '../../hooks/useKernel';

interface LeftDockProps {
    activePanel: string | null;
    onPanelSelect?: (panelId: string) => void;
}

export const LeftDock: React.FC<LeftDockProps> = ({ activePanel, onPanelSelect }) => {
    const { panelColors } = useColorStealing();
    const { left: leftColor } = panelColors;

    const { state } = useKernel();
    // BIO is hidden unless triggered (e.g. combat state or finding something?)
    // FLIGHT triggers warp animation

    const BUTTONS = [
        { id: 'SIM', label: 'SIM', color: 'text-cyan-400', border: 'border-cyan-500/50' },
        { id: 'MEM', label: 'MEM', color: 'text-fuchsia-400', border: 'border-fuchsia-500/50' },
        { id: 'SHOP', label: 'SHOP', color: 'text-green-400', border: 'border-green-500/50' },
        // BIO button hidden by default, logic can be added later to show it
        // { id: 'BIO', label: '', color: 'text-red-400', border: 'border-red-500/50' }, 
        { id: 'FLIGHT', label: 'WARP', color: 'text-yellow-400', border: 'border-yellow-500/50', action: 'WARP' },
    ];

    return (
        <div className={`
        h-full w-full bg-[#0a0a0a]/70 backdrop-blur-sm p-1 flex flex-col shadow-2xl z-30 relative gap-1 transition-all duration-300
        ${leftColor.stolen
                ? 'border border-neutral-800 hover:bg-[#111]/80 hover:border-neutral-700'
                : 'border border-cyan-500/30 hover:bg-[#111]/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'}
      `}
        >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" />

            {/* Header / Deco */}
            <div className="h-4 w-full flex items-center justify-center mb-1 shrink-0 bg-black/40 border-b border-white/5">
                <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-neutral-600 rounded-full" />
                    <div className="w-1 h-1 bg-neutral-600 rounded-full" />
                    <div className="w-1 h-1 bg-neutral-600 rounded-full" />
                </div>
            </div>

            {/* Button Stack */}
            {BUTTONS.map((btn) => {
                const isActive = activePanel === btn.id;
                return (
                    <button
                        key={btn.id}
                        onClick={() => {
                            if (btn.action === 'WARP') {
                                // Trigger Warp / Flight Mode
                                // We need a way to trigger this. Passing a prop or using useKernel/context?
                                // MainGrid has onFlightMode. We need to pass it down to LeftDock.
                                // For now, let's assume onPanelSelect can handle special IDs or we add a prop.
                                onPanelSelect && onPanelSelect(btn.id);
                            } else {
                                onPanelSelect && onPanelSelect(btn.id);
                            }
                        }}
                        className={`
              flex-1 relative transition-all duration-200 group border
              flex items-center justify-center
              ${isActive
                                ? 'bg-neutral-800 border-neutral-600 text-neutral-200 shadow-[inset_0_2px_5px_rgba(255,255,255,0.05)] translate-y-[1px]'
                                : 'bg-[#0f0f0f] border-black text-neutral-600 shadow-[0_2px_0_black] hover:bg-neutral-800 hover:border-neutral-500 hover:text-neutral-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5'}
            `}
                    >
                        {/* Active Indicator Line */}
                        {isActive && (
                            <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${btn.color.replace('text-', 'bg-')}`} />
                        )}

                        {/* Label */}
                        <span className="writing-mode-vertical text-[9px] font-bold tracking-[0.2em] uppercase text-shadow-sm mt-2" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                            {btn.label}
                        </span>

                        {/* Corner Accents */}
                        <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/10 transition-all group-hover:border-white/30" />
                        <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-white/10 transition-all group-hover:border-white/30" />
                    </button>
                );
            })}
            {/* Footer / Deco */}
            <div className="h-4 w-full flex items-center justify-center mt-1 shrink-0 bg-black/40 border-t border-white/5">
                <div className="text-[6px] text-neutral-700 font-mono">SYS</div>
            </div>
        </div>
    );
};
