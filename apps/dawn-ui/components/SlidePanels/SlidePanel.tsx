import React from 'react';
import { PanelFrame } from '../SlidePanels/PanelFrame';

interface SlidePanelProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({ isOpen, title, onClose, children }) => {
  return (
    <div
      className={`
        absolute top-0 bottom-0
        /*
          The main grid uses: px-[4%] gap-[2%] and the left panel is w-[25%].
          When the slide panel opens, it should fill ALL space to the right of the left panel
          (i.e., flush against the left panel's right edge), and run to the far right edge.
        */
        left-[calc(4%+25%)] right-0
        z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
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