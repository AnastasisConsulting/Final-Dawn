/**
 * UI STABILITY WARNING: 
 * This component is part of the established "High-Density / Professional Sleek" UI standard.
 * DO NOT modify the height (h-8), font sizes (text-[10px]/text-[8px]), or marquee scaling.
 * Maintain the low-profile status bar aesthetic.
 */
import React, { useRef, useState } from 'react';
import { useKernel } from '../../hooks/useKernel';
import { createSimulation, AffinitySimulation, HierarchyLevel } from 'eideus-affinity-system';

/**
 * Footer: The lower status bar of the Eideus Dawn interface.
 * Updated with 3D-aware transition logic for the warp sequence collapse.
 */
export const Footer: React.FC = () => {
  const { state } = useKernel();
  const isWarping = state.isWarping;

  // Affinity Simulation Ref
  const simRef = useRef<AffinitySimulation | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isSimRunning, setSimRunning] = useState(false);

  const statusItems = [
    "HEALTH: CRITICAL",
    "DEBT: 9,400,210 CR",
    "O2: 88%",
    "STRESS: 92%",
    "WARRANT: ACTIVE",
    "LICENSING: COMMUNITY"
  ];

  const handleSimTrigger = () => {
    if (isSimRunning) {
      // STOP SIMULATION
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSimRunning(false);
      console.log('[Footer] Affinity System Simulation STOPPED.');
    } else {
      // START SIMULATION
      if (!simRef.current) {
        console.log('[Footer] Initializing Affinity Simulation...');
        simRef.current = createSimulation();
      }

      console.log('[Footer] Affinity System Simulation STARTED.');
      setSimRunning(true);

      intervalRef.current = window.setInterval(() => {
        if (simRef.current) {
          simRef.current.tick();
          const tick = simRef.current.getGlobalTick();
          console.log(`[Affinity Sim] Tick ${tick} | Unrest: ${simRef.current.getLevelAggregate(HierarchyLevel.INTERSTELLAR).unrest.toFixed(2)}`);
        }
      }, 2500); // 2.5s per tick
    }
  };

  return (
    <footer
      className="h-8 shrink-0 flex w-full text-[10px] font-mono bg-[#020202] transition-all duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1)"
      style={{
        transformStyle: 'preserve-3d',
        backgroundColor: isWarping ? '#000' : '#020202',
        borderTop: isWarping ? '1px solid #06b6d4' : 'none',
        opacity: isWarping ? 0 : 1
      }}
    >
      {/* Left 10%: Fractal Sim Trigger */}
      <div className="w-[10%] bg-[#050505] border-r border-[#111] flex items-center justify-center relative shadow-[inset_-5px_0_10px_black] overflow-hidden">
        <button
          onClick={handleSimTrigger}
          className={`font-bold transition-colors w-full h-full text-[9px] tracking-tighter ${isSimRunning ? 'bg-orange-500 text-black animate-pulse' : 'bg-cyan-500/80 text-black hover:bg-cyan-400'}`}
        >
          {isSimRunning ? 'STOP SIM' : 'SIMULATE'}
        </button>
      </div>

      {/* Center 80%: Raised/Shadowed - Horizontal Marquee */}
      <div className="w-[80%] bg-[#080808] border-t border-neutral-900/50 relative flex items-center px-4 overflow-hidden text-neutral-400">
        <div className={`whitespace-nowrap ${isWarping ? 'opacity-0' : 'animate-marquee'} font-['VT323'] text-[12px] tracking-wide transition-opacity duration-500`}>
          * OBEY THE ALGORITHM * CONSUME MORE PRODUCT * REPORT DISSENT TO YOUR LOCAL MAGISTRATE * SUNLIGHT IS A SUBSCRIPTION SERVICE * HAPPINESS IS MANDATORY * YOUR DEBT IS YOUR VALUE *
        </div>

        {isWarping && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-0.5 bg-cyan-500 animate-pulse shadow-[0_0_15px_#06b6d4]" />
          </div>
        )}
      </div>

      {/* Right 10%: Inset/Sunken - Vertical Status */}
      <div className="w-[10%] bg-[#030303] shadow-[inset_5px_0_10px_black] border-l border-[#111] overflow-hidden relative">
        <div className={`flex flex-col items-center justify-center w-full h-full ${isWarping ? 'opacity-0' : 'animate-vertical-scroll'} space-y-0.5 transition-opacity duration-500 px-1`}>
          {statusItems.map((item, i) => (
            <span key={i} className="text-red-400 text-[8px] font-bold whitespace-nowrap">{item}</span>
          ))}
        </div>
      </div>
    </footer>
  );
};
