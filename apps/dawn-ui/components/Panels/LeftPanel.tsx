import React from 'react';
import { PanelFrame } from '../SlidePanels/PanelFrame';
import { NavBot } from '../SlidePanels/panels/Navbot';
import { JunkScatter } from '../Features/Vizzy/JunkScatter';
import { TreatDispenser } from '../Features/Vizzy/TreatDispenser';
import { vizzyOrchestrator } from '../../src/services/VizzyOrchestrator';

import { useColorStealing } from '../../src/contexts/ColorStealingContext';

interface LeftPanelProps {
  onTargetSelect: (target: 'navbot' | 'vizzy' | 'lyra') => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ onTargetSelect }) => {
  const { panelColors } = useColorStealing();
  const leftColor = panelColors.left;

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Space Junk Decorations */}
      <JunkScatter panelId="left" />
      {/* CSS for scan animation */}
      <style>{`
            @keyframes scan-up {
                0% { bottom: -20%; opacity: 0; }
                15% { opacity: 0; } /* Wait phase */
                15.1% { opacity: 0.8; bottom: -20%; } /* Start appearing */
                40% { bottom: 120%; opacity: 0.8; } /* Move up */
                40.1% { opacity: 0; } /* Hide */
                100% { opacity: 0; } /* Wait rest of cycle */
            }
        `}</style>

      {/* Top 50% – NavBot */}
      <div
        className="h-1/2 w-full min-h-0 cursor-pointer"
        onClick={() => onTargetSelect('navbot')}
        title="Select NAV Channel"
      >
        <PanelFrame
          title="NavBot"
          className={`
                transition-colors duration-500
                ${leftColor.stolen ? 'border-neutral-800' : 'border-cyan-500/30 hover:border-cyan-500/50'}
            `}
        >
          <div className="relative w-full h-full overflow-hidden">
            <NavBot />
          </div>
        </PanelFrame>
      </div>

      {/* Bottom 50% – Vizzy */}
      <div
        className="h-1/2 w-full min-h-0 cursor-pointer"
        onClick={() => onTargetSelect('vizzy')}
        title="Select VIZ Channel"
      >
        <PanelFrame title="Vizzy" className="!bg-transparent !backdrop-blur-none border-blue-800/40 opacity-0 hover:opacity-100 transition-opacity">
          <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center pointer-events-auto">
            {/* Vizzy Interactions handled by FeederDock now */}
            <div className="text-cyan-500/30 text-[10px] uppercase tracking-widest animate-pulse">
              Signal Lock Active
            </div>
          </div>
        </PanelFrame>
      </div>
    </div>
  );
};
