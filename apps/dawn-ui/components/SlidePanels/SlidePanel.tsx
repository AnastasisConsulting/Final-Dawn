import React from 'react';
import { PanelFrame } from '../SlidePanels/PanelFrame';

interface SlidePanelProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
  side?: 'left' | 'right';
  layout?: 'fixed' | 'flex';
}

export const SlidePanel: React.FC<SlidePanelProps> = ({ isOpen, title, onClose, children, side = 'right', layout = 'fixed' }) => {
  const isFlex = layout === 'flex';

  // Fixed Global Positioning (Old)
  const fixedClasses = side === 'left'
    ? 'left-[calc(5%+1%)] right-[auto] w-[30%] origin-left'
    : 'right-[calc(5%+1%)] left-[auto] w-[30%] origin-right';

  // Flexible Container Positioning (New)
  // We use w-[350%] to make the panel 3.5x wider than its 20% container.
  // Both sides must use absolute positioning to ignore parent's flow direction and anchor correctly.
  const flexBase = 'h-full pointer-events-auto transition-all duration-300';
  const flexLeft = 'absolute top-0 left-0 w-[350%]';
  const flexRight = 'absolute top-0 right-0 w-[350%]';

  const flexClasses = isFlex
    ? (side === 'left' ? `${flexBase} ${flexLeft}` : `${flexBase} ${flexRight}`)
    : '';

  const positionClasses = isFlex ? flexClasses : fixedClasses;

  const translateClass = side === 'left' ? '-translate-x-full' : 'translate-x-full';

  return (
    <div
      className={`
        ${isFlex ? '' : 'absolute top-0 bottom-0'} ${positionClasses}
        z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isOpen ? 'translate-x-0 opacity-100' : `${translateClass} opacity-0 pointer-events-none`}
      `}
    >
      <PanelFrame
        title={title}
        className="bg-neutral-900/95 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md"
      >
        <div className="p-4 h-full w-full flex flex-col">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-cyan-400 font-mono text-xs tracking-wider">PANEL // {title}</span>
            </div>
            <button
              onClick={onClose}
              className="
                      text-neutral-500 text-[10px] uppercase tracking-wider
                      border border-transparent px-2 py-1 transition-all duration-200
                      hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30 
                      hover:shadow-[0_0_10px_rgba(220,38,38,0.2)] active:scale-95
                    "
            >
              Close
            </button>
          </div>
          {/* Fill the available panel space; individual panels handle their own typography/layout. */}
          <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
            <div className="w-full h-full">
              {children}
            </div>
          </div>
        </div>
      </PanelFrame>
    </div>
  );
};