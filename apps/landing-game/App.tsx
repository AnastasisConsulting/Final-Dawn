import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { useGameStore } from './store';
import { GamePhase } from './types';
import { getMissionUpdate } from './services/geminiService';
import { LandingContext } from '../dawn-ui/types/landingContext';
import { generateWorldContent } from './services/worldGeneration';
import { PersistenceService } from '../dawn-ui/src/services/PersistenceService';

interface LandingGameProps {
  landingContext: LandingContext;
  onLandingComplete?: (success: boolean) => void;
}

const App: React.FC<LandingGameProps> = ({ landingContext, onLandingComplete }) => {
  const { phase, resetGame, setMessage, sessionId } = useGameStore();
  const [showOverlay, setShowOverlay] = useState(false);
  const landingReportedRef = useRef<number | null>(null);

  console.log('[Landing Game] Received landing context:', landingContext);

  useEffect(() => {
    // Initial greeting with destination name
    const dest = landingContext.destination;
    getMissionUpdate(GamePhase.ORBIT, 3000, 100, 0).then(msg =>
      setMessage(`Initiating atmospheric entry to ${dest.name || 'unknown destination'}...`)
    );
  }, [setMessage, sessionId, landingContext]);

  // Handle delayed overlay for game end states
  useEffect(() => {
    if (phase === GamePhase.LANDED) {
      // Give the player time to see the celebration effects
      const timer = setTimeout(() => setShowOverlay(true), 3500);
      return () => clearTimeout(timer);
    } else if (phase === GamePhase.CRASHED) {
      // Short delay for crash to register what happened
      const timer = setTimeout(() => setShowOverlay(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== GamePhase.LANDED || !onLandingComplete) return;
    if (landingReportedRef.current === sessionId) return;
    landingReportedRef.current = sessionId;

    let timer: NodeJS.Timeout;

    // Mark location as visited (only on successful landing)
    const address = landingContext.destination.address || 'UNKNOWN';
    PersistenceService.markLocationVisited(address);
    console.log('[Landing Game] Location marked as visited:', address);

    // Trigger world generation if first visit
    if (landingContext.firstVisit) {
      console.log('[Landing Game] First visit - triggering world generation...');
      generateWorldContent({
        galaxy: landingContext.destination.galaxy,
        system: landingContext.destination.system,
        object: landingContext.destination.object,
        civ: landingContext.destination.civ,
        city: landingContext.destination.city,
        region: landingContext.destination.region,
        name: landingContext.destination.name || 'Unknown',
        address: landingContext.destination.address || 'UNKNOWN',
      })
        .then((result) => {
          if (result.success) {
            console.log('[Landing Game] World generation complete:', result.generated);
          } else {
            console.error('[Landing Game] World generation failed:', result.error);
          }
          // Proceed with landing complete regardless of generation outcome
          timer = setTimeout(() => onLandingComplete(true), 2000);
        })
        .catch((error) => {
          console.error('[Landing Game] World generation error:', error);
          // Still complete landing even if generation fails
          timer = setTimeout(() => onLandingComplete(true), 2000);
        });
    } else {
      // Not first visit - just complete landing
      timer = setTimeout(() => onLandingComplete(true), 4000);
    }

    return () => clearTimeout(timer);
  }, [phase, onLandingComplete, sessionId, landingContext]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Key forces re-mount of entire 3D scene on reset */}
      <GameCanvas key={sessionId} landingContext={landingContext} />
      <HUD />

      {/* Game Over Screen */}
      {showOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-1000">
          <h1 className={`text-6xl font-bold mb-4 ${phase === GamePhase.LANDED ? 'text-green-500' : 'text-red-500'}`}>
            {phase === GamePhase.LANDED ? 'MISSION SUCCESS' : 'CRITICAL FAILURE'}
          </h1>
          <p className="text-white text-xl mb-8 max-w-md text-center">
            {phase === GamePhase.LANDED
              ? "The asset has been delivered safely to the surface. Welcome home, pilot."
              : "Telemetry lost. Rescue teams dispatched to crash site."}
          </p>
          <button
            onClick={() => {
              setShowOverlay(false);
              resetGame();
            }}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-lg transition-colors border-2 border-cyan-400"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
