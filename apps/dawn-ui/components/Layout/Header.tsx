// Final_Dawn_of_Eideus/apps/dawn-ui/components/Layout/Header.tsx

import React, { useState, useEffect } from 'react';
import { useKernel } from '../../hooks/useKernel';

import { PersistenceService } from '../../src/services/PersistenceService';
import { useGame } from '../../src/context/GameContext';

const TITLE_GAME = "EIDEUS DAWN";
const TITLE_LOC = "SECTOR: NULL";

export const Header: React.FC<{ onLaunchFlight?: () => void; onToggleDev?: () => void }> = ({ onLaunchFlight, onToggleDev }) => {
  const { state: kernelState, hydrate, loadLocationFromAddress } = useKernel();
  const { state: gameState, actions: gameActions } = useGame();
  const isWarping = kernelState.isWarping;
  const [displayText, setDisplayText] = useState(TITLE_GAME);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => {
        setDisplayText(prev => prev === TITLE_GAME ? TITLE_LOC : TITLE_GAME);
      }, 150);
      setTimeout(() => {
        setIsGlitching(false);
      }, 400);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    PersistenceService.saveGame(gameState, {
      lastAddress: kernelState.address.full,
      visitedNodes: kernelState.visitedNodes
    });
    // Visual feedback?
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 500);
  };

  const handleLoad = async () => {
    const saved = PersistenceService.loadGame();
    if (saved) {
      gameActions.loadGame(saved.gameState);
      if (saved.kernel.lastAddress) {
        await loadLocationFromAddress(saved.kernel.lastAddress);
      }
      // Re-hydrate the kernel state with whatever else was saved
      hydrate({
        visitedNodes: saved.kernel.visitedNodes
      });
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 800);
    }
  };

  return (
    <header
      className={`h-16 shrink-0 z-50 bg-[#050505] shadow-[0_10px_30px_rgba(0,0,0,1)] flex items-center justify-between px-6 relative border-b border-[#1a1a1a] transition-all duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1)`}
      style={{
        transformStyle: 'preserve-3d',
        backgroundColor: isWarping ? '#000' : '#050505',
        borderColor: isWarping ? '#06b6d4' : '#1a1a1a',
        opacity: isWarping ? 0 : 1
      }}
    >
      {/* Left decorative bits */}
      <div className="flex flex-col gap-0.5 opacity-30">
        <div className={`w-16 h-[2px] transition-colors duration-500 ${isWarping ? 'bg-cyan-500' : 'bg-red-800'}`} />
        <div className="w-8 h-[2px] bg-neutral-600" />
      </div>

      <div className="flex flex-col items-center">
        <h1
          className={`text-4xl font-bold tracking-[0.2em] font-['Orbitron'] transition-all duration-700 ${isGlitching || isWarping ? 'glitch-active text-cyan-400' : 'text-neutral-300'}`}
          data-text={displayText}
          style={{
            textShadow: (isGlitching || isWarping) ? '2px 0 #06b6d4, -2px 0 #3b82f6' : '0 0 10px rgba(255,255,255,0.1)',
            transform: isWarping ? 'scale(0.8) translateZ(-50px)' : 'none'
          }}
        >
          {isWarping ? "TRANSITIONING" : displayText}
        </h1>
        <div className="text-[8px] text-neutral-600 tracking-[0.5em] mt-[-4px]">
          {isWarping ? "ORBITAL // INSERTION // ACTIVE" : "CORPORATE // SANCTIONED // REALITY"}
        </div>
      </div>

      {/* Right decorative bits & Save/Load */}
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          {/* DEV Button */}
          <button
            onClick={onToggleDev}
            className="px-2 py-1 border border-neutral-800 text-[9px] uppercase tracking-widest text-yellow-600 hover:border-yellow-500/50 hover:text-yellow-400 transition-all bg-black/20"
          >
            CMD
          </button>
          <button
            onClick={handleSave}
            className="px-2 py-1 border border-neutral-800 text-[9px] uppercase tracking-widest text-neutral-500 hover:border-cyan-500/50 hover:text-cyan-400 transition-all bg-black/20"
          >
            Save_State
          </button>
          <button
            onClick={handleLoad}
            className="px-2 py-1 border border-neutral-800 text-[9px] uppercase tracking-widest text-neutral-500 hover:border-magenta-500/50 hover:text-magenta-400 transition-all bg-black/20"
          >
            Load_State
          </button>
        </div>
        <div className="text-[9px] text-neutral-700 font-mono text-right leading-tight">
          SYS_VER: 0.9.4 // <span className="text-cyan-600">TURN: {gameState.turnCount || 0}</span><br />
          <span className={`${isWarping ? 'text-cyan-900' : 'text-red-900/50'}`}>
            {isWarping ? "STABILIZING_FLIGHT_ONE" : "UNAUTHORIZED_ACCESS"}
          </span>
        </div>
      </div>
    </header>
  );
};