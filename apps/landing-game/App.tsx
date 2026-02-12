import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';
import { requestPointerLock } from './components/Controls';

import { LandingContext } from './types';

export default function App({ landingContext, onLandingComplete }: { landingContext?: LandingContext, onLandingComplete?: (success: boolean) => void }) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [hudData, setHudData] = useState<any>({
    score: 0, health: 100, wave: 1, speed: 0, altitude: 0, heading: 0,
    targetLocked: false, flightAssist: true, weaponLevel: 1, distanceToTarget: 0
  });
  const [finalScore, setFinalScore] = useState(0);
  const [worldId, setWorldId] = useState(landingContext?.destination.address || 'G1-S1-O1'); // Default to context or first location

  const startGame = async () => {
    await requestPointerLock();
    setGameState('PLAYING');
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('GAMEOVER');
    // Release pointer lock
    document.exitPointerLock();
  };

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas shadows camera={{ fov: 60, position: [0, 5, 10] }} gl={{ antialias: false, toneMappingExposure: 1.2 }}>
        <Suspense fallback={null}>
          <GameScene
            isGameActive={gameState === 'PLAYING'}
            onUpdateHUD={(data) => setHudData((prev: any) => ({ ...prev, ...data }))}
            onGameOver={handleGameOver}
            worldId={worldId}
          />
        </Suspense>
        {/* Deep space fog for depth perception */}
        <fog attach="fog" args={['#020617', 5000, 30000]} />
      </Canvas>

      {gameState === 'PLAYING' && <HUD data={hudData} />}

      {gameState === 'START' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="text-center">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-600 mb-2 tracking-tighter shadow-cyan-500/50">
              STAR VIPER
            </h1>
            <p className="text-cyan-500 mb-8 tracking-[1em] text-xs font-bold uppercase border-t border-b border-cyan-900 py-2 bg-black/50">
              Orbital Drop | 4025 AD
            </p>
            <div className="bg-slate-900/90 p-8 border-l-4 border-cyan-600 rounded-r-lg mb-8 text-left text-sm text-slate-300 font-mono shadow-2xl max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-700 pb-2 mb-4">
                <span>MISSION_BRIEF</span>
                <span className="text-cyan-500 animate-pulse">ACTIVE</span>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                Hostile drones detected in upper atmosphere.
                Execute orbital entry maneuver. Follow the <span className="text-yellow-400">Guidance Ribbon</span> to the designated landing zone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-yellow-500">W/S</span> Thrust</div>
                <div><span className="text-yellow-500">A/D</span> Roll</div>
                <div><span className="text-yellow-500">MOUSE</span> Vector</div>
                <div><span className="text-yellow-500">L-CLICK</span> Plasma</div>
                <div><span className="text-yellow-500">SHIFT</span> Booster</div>
                <div><span className="text-yellow-500">SPACE</span> Air-Brake</div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="group relative px-10 py-4 bg-cyan-900/30 overflow-hidden rounded-none border border-cyan-500/50 text-cyan-100 font-bold tracking-widest hover:bg-cyan-500/20 transition-all"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              INITIATE DROP
            </button>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 z-50 backdrop-blur-md">
          <div className="text-center border border-red-500/30 p-12 bg-black/80">
            <h2 className="text-6xl font-black text-red-600 mb-2 tracking-tighter">CRITICAL FAILURE</h2>
            <p className="text-red-200 font-mono text-xl mb-8">SCORE: {finalScore}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-900/50 border border-red-500 text-white hover:bg-red-600 transition-colors font-mono"
            >
              REBOOT_SEQUENCE
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .group-hover\\:animate-shimmer { animation: shimmer 1s infinite; }
      `}</style>
    </div>
  );
}