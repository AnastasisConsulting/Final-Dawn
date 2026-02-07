// Final_Dawn_of_Eideus/apps/dawn-ui/App.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { MainGrid } from './components/Layout/MainGrid';
import { Starfield } from './components/Layout/Starfield';
import FlightApp from '../flight-one/App';
import LandingApp from '../landing-game/App';
import VizzyApp from '../alive-object-engine/Vizzy/App';
import { useKernel } from './hooks/useKernel';
import { useLandingPrep } from './hooks/useLandingPrep';
import { useGame } from './src/context/GameContext';
import { useAutoSave } from './src/hooks/useAutoSave';
import masterIndex from './src/world/master_locations_index.json';
import { PersistenceService } from './src/services/PersistenceService';
import { FeederDock } from './components/Panels/FeederDock';
import { vizzyOrchestrator } from './src/services/VizzyOrchestrator';
import { ColorStealingProvider } from './src/contexts/ColorStealingContext';

type FlightState = 'idle' | 'retracting' | 'warping' | 'flying';

type LandingPayload = {
  id: number;
  targetName: string;
  targetAddress?: string;
  systemName?: string;
  landingNarration: string;
  openingScene: string;
};

import { LandingContext } from './types/landingContext';

/**
 * App: The Root Orchestrator for Dawn of Eideus.
 * Manages the high-precision 4-second animation sequence:
 * 1. UI Panels open like bay doors (pivoting outward).
 * 2. Camera zooms forward into the screen (translateZ).
 * 3. Starfield background stretches stars to edges (Warp Jump).
 * 4. Chat/Panels fade to nothing.
 */
const App: React.FC = () => {
  const { state, dispatch, loadLocationFromAddress } = useKernel();
  const { state: gameState, actions: gameActions } = useGame();
  useAutoSave();
  const landingPrep = useLandingPrep();
  const [rippleOrigin, setRippleOrigin] = useState({ x: '50%', y: '50%' });

  // Internal animation state
  const [flightState, setFlightState] = useState<FlightState>('idle');
  const [showFlight, setShowFlight] = useState(false);
  const [handoffToken, setHandoffToken] = useState<number | null>(null);
  const [landingPayload, setLandingPayload] = useState<LandingPayload | null>(null);
  const [showLandingGame, setShowLandingGame] = useState(false);
  const [landingContext, setLandingContext] = useState<LandingContext | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(t => window.clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const loadWorldAssets = useCallback((addressKey: string, galaxy: string, system: string, object: string) => {
    void loadLocationFromAddress(addressKey);
    void fetch(`/api/topography?galaxy=${encodeURIComponent(galaxy)}&system=${encodeURIComponent(system)}&object=${encodeURIComponent(object)}`);
    void fetch(`/api/city-map?galaxy=${encodeURIComponent(galaxy)}&system=${encodeURIComponent(system)}&object=${encodeURIComponent(object)}&civ=1&ct=1`);
  }, [loadLocationFromAddress]);

  useEffect(() => {
    if (!landingPrep?.targetId) return;
    const registry = (masterIndex as any).registry;
    const entry = registry?.[landingPrep.targetId];
    if (!entry) return;
    const dirParts = String(entry.directory || '').split('/').filter(Boolean);
    if (dirParts.length < 3) return;
    const [galaxy, system, object] = dirParts;
    loadWorldAssets(landingPrep.targetId, galaxy, system, object);
  }, [landingPrep, loadWorldAssets]);

  /**
   * REACTION LOGIC:
   * Monitors the Kernel for the warp signal triggered by NavBot or UI button.
   */
  useEffect(() => {
    if (state.isWarping && flightState === 'idle') {
      initiateWarpSequence();
    }
  }, [state.isWarping]);

  useEffect(() => {
    const handleCreated = (e: any) => {
      const char = e.detail;
      gameActions.setIdentity(char.coreClass, char.subAffinity, char.crossId);
      // Award initial XP if level > 1 was set (though usually starts at L1)
      if (char.xp > 0) gameActions.gainXp(char.xp);
      // dispatch({ type: 'CLOSE_PANELS' }); // If such action exists in kernel
    };

    const handleFeedRequest = (e: any) => {
      const { type } = e.detail;
      vizzyOrchestrator.feed(type);
    };

    window.addEventListener('character-created', handleCreated);
    window.addEventListener('ui-feed-request', handleFeedRequest);
    return () => {
      window.removeEventListener('character-created', handleCreated);
      window.removeEventListener('ui-feed-request', handleFeedRequest);
    };
  }, [gameActions]);

  const handleGlobalClick = (e: React.MouseEvent) => {
    if (flightState !== 'idle' || showLandingGame) return;
    const xPct = (e.clientX / window.innerWidth) * 100;
    const yPct = (e.clientY / window.innerHeight) * 100;
    setRippleOrigin({ x: `${xPct}%`, y: `${yPct}%` });
  };

  const initiateWarpSequence = () => {
    const token = Date.now();
    clearTimers();

    // T=0ms: Initiate the 4-second transition
    // 1. Starfield starts stretching stars immediately.
    // 2. MainGrid triggers bay door rotations.
    // 3. Container begins forward Z-translation.
    setFlightState('warping');

    // T=1500ms: Mount FlightApp in the background
    const t1 = window.setTimeout(() => {
      setHandoffToken(token);
      setShowFlight(true);
    }, 1500);

    // T=4000ms: Sequence Complete
    // Full handoff to Flight environment; UI is now fully transparent and distant.
    const t2 = window.setTimeout(() => {
      setFlightState('flying');
    }, 4000);

    timersRef.current.push(t1, t2);
  };

  const abortFlightMode = () => {
    clearTimers();
    setFlightState('idle');
    setShowFlight(false);
    setHandoffToken(null);
    setShowLandingGame(false);
    setLandingContext(null);
    dispatch({ type: 'SET_WARP_STATE', active: false });
  };

  const handleFlightHandoffComplete = () => {
    setHandoffToken(null);
    dispatch({ type: 'SET_WARP_STATE', active: false });
  };

  const handleReturnToDawn = (payload: {
    target: { name: string; address?: string };
    landingNarration: string;
    openingScene: string;
  }) => {
    clearTimers();
    setLandingPayload({
      id: Date.now(),
      targetName: payload.target.name,
      targetAddress: payload.target.address,
      landingNarration: payload.landingNarration,
      openingScene: payload.openingScene,
    });

    setFlightState('idle');
    setShowFlight(false);
    setHandoffToken(null);
    dispatch({ type: 'SET_WARP_STATE', active: false });
  };

  const handleLaunchLandingGame = (target: { id: string; name: string; address?: string; position?: [number, number, number]; velocity?: [number, number, number]; heading?: number }) => {
    clearTimers();
    document.exitPointerLock?.();

    // Parse destination coordinates from address
    const addressParts = (target.address || 'G1-S1-O1').split('-');
    const galaxy = addressParts[0] || 'G1';
    const system = addressParts[1] || 'S1';
    const object = addressParts[2] || 'O1';

    // TODO: Check persistence for first visit
    // ✅ STEP 4c: Create landing context with visit tracking
    const targetAddress = [galaxy, system, object].join('-');
    const hasVisited = PersistenceService.hasVisited(targetAddress);

    const context: LandingContext = {
      id: target.id, // Use target.id for consistency
      ship: {
        model: 'fighter', // Keep 'fighter' as per original
        position: { x: target.position?.[0] || 0, y: target.position?.[1] || 8000, z: target.position?.[2] || 0 }, // Keep original position logic
        velocity: { x: target.velocity?.[0] || 0, y: target.velocity?.[1] || -50, z: target.velocity?.[2] || 0 }, // Keep original velocity logic
        heading: target.heading || 0,
        health: 100,
        shieldLevel: 100,
      },
      destination: {
        galaxy, system, object, // Use parsed galaxy, system, object
        civ: 1, city: 1, region: 1,
        address: targetAddress,
        name: target.name, // Use target.name
      },
      firstVisit: !hasVisited,
      timestamp: Date.now(),
    };

    // Check if location has been visited - auto-skip if so
    if (hasVisited) {
      console.log('[Dawn] Skipping landing - location already visited:', targetAddress);
      // Skip directly to world load
      setTimeout(() => {
        loadWorldAssets(target.id, galaxy, system, object); // Use target.id for addressKey
        handleLandingGameComplete(true); // Simulate successful landing
      }, 1000);
      return;
    }

    setLandingContext(context);
    console.log('[Flight Handoff] Landing sequence initiated for:', target.name, target.address);
    setShowFlight(false);
    setShowLandingGame(true);
    setFlightState('idle');
    setHandoffToken(null);
    dispatch({ type: 'SET_WARP_STATE', active: false });
  };

  const handleLandingGameComplete = (success: boolean) => {
    if (!success || !landingContext) return;
    localStorage.setItem('gemini_flight_landed', 'true');
    window.dispatchEvent(
      new CustomEvent('landing-success', {
        detail: { targetId: landingContext.id, targetName: landingContext.destination.name },
      })
    );
    window.dispatchEvent(new CustomEvent('dawn-landed', { detail: { name: landingContext?.destination?.name, address: landingContext?.destination?.address } }));
    handleReturnToDawn({
      target: { name: landingContext.destination.name, address: landingContext.destination.address },
      landingNarration: `Atmospheric entry successful. Surface protocols initiated at ${landingContext.destination.name}.`,
      openingScene: 'surface_entry',
    });
    setShowLandingGame(false);
    setLandingContext(null);
  };

  const isUIActive = flightState === 'idle' && !showLandingGame;

  const dawnUi = (
    <div
      className="flex flex-col h-screen w-screen bg-[#020202] text-cyan-50 select-none overflow-hidden relative"
      onClickCapture={handleGlobalClick}
      style={{ perspective: '2000px' }}
    >
      {/* Background Layer: Stars stretch toward edges during 'warping' */}
      <Starfield flightState={flightState} />

      {/* VIZZY LAYER: Procedural 3D Object - Full screen behind UI panels, in front of starfield (z-5) */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <VizzyApp />
      </div>

      {/* ABORT OVERRIDE */}
      <div className={`fixed top-4 right-4 z-[100] transition-all duration-500 ease-out ${flightState !== 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); abortFlightMode(); }}
          className="group relative flex items-center gap-3 bg-red-950/90 border border-red-600/50 pl-4 pr-2 py-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:bg-red-900 hover:border-red-500 transition-all"
        >
          <div className="flex flex-col items-start font-mono">
            <span className="text-[10px] font-bold text-red-500 tracking-[0.2em]">EMERGENCY</span>
            <span className="text-sm font-bold text-red-100 tracking-widest uppercase">Abort Warp</span>
          </div>
          <div className="w-6 h-6 flex items-center justify-center border border-red-500/30 bg-red-900/20 text-red-400 group-hover:bg-red-500 group-hover:text-black transition-colors">
            <span className="text-xs font-bold font-sans">✕</span>
          </div>
        </button>
      </div>

      {/* DEV COMMANDS OVERLAY (TEMP) */}
      <div className="fixed bottom-24 left-8 z-[200] pointer-events-none font-mono text-[10px] text-cyan-300 opacity-70">
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded border border-cyan-900/30 shadow-lg">
          <h3 className="font-bold text-cyan-100 mb-2 border-b border-cyan-800 pb-1">DEV PROTOCOLS</h3>
          <ul className="space-y-1">
            <li><span className="text-yellow-400">/beta-test [CLS] [AFF]</span> : Auto-Pilot</li>
            <li><span className="text-yellow-400">/stop-bot</span> : Terminate Auto-Pilot</li>
            <li><span className="text-yellow-400">/warp [ADDR]</span> : Quantum Jump</li>
            <li><span className="text-yellow-400">/telemetry</span> : State Dump</li>
            <li><span className="text-yellow-400">/sim-combat [1-10]</span> : Mock Encounter</li>
            <li><span className="text-yellow-400">/spawn-loot [RARITY]</span> : Drop Item</li>
            <li><span className="text-yellow-400">/force-level [LVL]</span> : Set Level</li>
            <li><span className="text-yellow-400">/export-logs</span> : Save Logs</li>
          </ul>
        </div>
      </div>

      {/* PRIMARY UI CONTAINER: Handles the 4s forward zoom into the screen */}
      <div
        className="relative z-10 flex flex-col h-full w-full transform-style-3d transition-all duration-[4000ms] cubic-bezier(0.4, 0, 0.2, 1)"
        style={{
          transform: flightState === 'idle'
            ? 'translateZ(0)'
            : 'translateZ(1200px)', // Camera moves "into" the screen
          opacity: flightState === 'flying' ? 0 : 1,
          pointerEvents: isUIActive ? 'auto' : 'none'
        }}
      >
        <FeederDock />

        {/* Header: Tilts up and away */}
        <div
          className="transition-all duration-[2000ms] ease-in-out"
          style={{
            transform: flightState !== 'idle' ? 'rotateX(-90deg) translateY(-200px)' : 'none',
            transformOrigin: 'top center',
            opacity: flightState !== 'idle' ? 0 : 1
          }}
        >
          <Header onLaunchFlight={initiateWarpSequence} />
        </div>

        <main className="flex-1 overflow-visible relative w-full h-full box-border transform-style-3d">
          <MainGrid
            onFlightMode={initiateWarpSequence}
          />
        </main>

        {/* Footer: Tilts down and away */}
        <div
          className="transition-all duration-[2000ms] ease-in-out delay-75"
          style={{
            transform: flightState !== 'idle' ? 'rotateX(90deg) translateY(200px)' : 'none',
            transformOrigin: 'bottom center',
            opacity: flightState !== 'idle' ? 0 : 1
          }}
        >
          <Footer />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* UI Layer: Fades out as the zoom finishes */}
      <div className={`h-full w-full transition-opacity duration-1000 ${!isUIActive ? 'opacity-0' : 'opacity-100'}`}>
        <ColorStealingProvider>
          {dawnUi}
        </ColorStealingProvider>
      </div>

      {/* Flight App Layer */}
      {showFlight && (
        <div className={`absolute inset-0 z-50 transition-opacity duration-1000 ${flightState === 'flying' ? 'opacity-100' : 'opacity-0'}`}>
          <FlightApp
            handoffToken={handoffToken}
            onHandoffComplete={handleFlightHandoffComplete}
            onReturnToDawn={handleReturnToDawn}
            onLaunchLandingGame={handleLaunchLandingGame}
            systemId={state.address.full || 'G1-S1'}
            playerLevel={gameState.level || 1}
            flightStats={gameState.flightStats}
            onLootAcquired={(item, amount) => {
              if (item === 'WEAPON') {
                gameActions.upgradeShip('weaponLevel');
                // Also add as item for selling? Or just upgrade?
                // Let's add a dummy item for feedback if needed, but the stat is what matters.
              } else {
                gameActions.addItem({
                  id: item,
                  name: item.replace('_', ' '),
                  type: item === 'NANITE_KIT' ? 'consumable' : 'RESOURCE',
                  rarity: 'common',
                  count: amount || 1
                });
              }
              // story xp for loot? or ledger? user says loot = gainXp(50)
              gameActions.gainXp(50);
            }}
            onEnemyDestroyed={(tier, enemyId) => {
              gameActions.recordKill('FLIGHT', tier, enemyId, state.address.full || 'G1-S1');
            }}
            onStoryXpAwarded={(amount) => {
              gameActions.gainXp(amount);
            }}
          />
        </div>
      )}

      {showLandingGame && landingContext && (
        <div className="absolute inset-0 z-50 transition-opacity duration-1000 opacity-100">
          <LandingApp
            landingContext={landingContext}
            onLandingComplete={handleLandingGameComplete}
          />
        </div>
      )}
    </div>
  );
};

export default App;
