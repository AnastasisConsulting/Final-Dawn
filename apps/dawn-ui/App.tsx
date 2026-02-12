/**
 * UI STABILITY WARNING: 
 * This is the Root Orchestrator for the "High-Density / Professional Sleek" UI standard.
 * DO NOT modify the 4-second flight/warp timing, the AppState transitions, or 
 * the 20/60/20 layout dependencies. The professional aesthetic must remain stable.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import { getDirectory } from 'eideus-routers';
import { PersistenceService } from './src/services/PersistenceService';
import { vizzyOrchestrator } from './src/services/VizzyOrchestrator';
import { ColorStealingProvider } from './src/contexts/ColorStealingContext';
import { SimProvider } from './src/context/SimContext';

// Hooks
import { useLaserPointer } from './src/hooks/useLaserPointer';
import { useWarpSequence, FlightState } from './src/hooks/useWarpSequence';

// Components
import { DevOverlay } from './components/Features/Dev/DevOverlay';
import { LandingContext } from './types/landingContext';

type LandingPayload = {
  id: number;
  targetName: string;
  targetAddress?: string;
  systemName?: string;
  landingNarration: string;
  openingScene: string;
};

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

  // Extracted Logic Hooks
  const { laserActive, laserPos } = useLaserPointer();
  const {
    flightState, showFlight, handoffToken,
    abortWarp, initiateWarp, setFlightState,
    setShowFlight, setHandoffToken
  } = useWarpSequence(state.isWarping);

  // State
  const [landingPayload, setLandingPayload] = useState<LandingPayload | null>(null);
  const [showLandingGame, setShowLandingGame] = useState(false);
  const [landingContext, setLandingContext] = useState<LandingContext | null>(null);
  const [activeChatTarget, setActiveChatTarget] = useState<'navbot' | 'vizzy' | 'lyra'>('navbot');
  const [devTerminalOpen, setDevTerminalOpen] = useState(false);
  const [showDevOverlay, setShowDevOverlay] = useState(false);

  const loadWorldAssets = useCallback((addressKey: string, galaxy: string, system: string, object: string) => {
    void loadLocationFromAddress(addressKey);
    void fetch(`/api/topography?galaxy=${encodeURIComponent(galaxy)}&system=${encodeURIComponent(system)}&object=${encodeURIComponent(object)}`);
    void fetch(`/api/city-map?galaxy=${encodeURIComponent(galaxy)}&system=${encodeURIComponent(system)}&object=${encodeURIComponent(object)}&civ=1&ct=1`);
  }, [loadLocationFromAddress]);

  useEffect(() => {
    if (!landingPrep?.targetId) return;

    const directory = getDirectory(landingPrep.targetId);
    if (!directory) return;

    const dirParts = directory.split('/').filter(Boolean);
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
      initiateWarp();
    }
  }, [state.isWarping]);

  useEffect(() => {
    const handleCreated = (e: any) => {
      const char = e.detail;
      // Initialize the full game state with attribute bonuses
      gameActions.initializeNewGame(
        char.name,
        char.coreClass,
        char.affinity,
        char.subAffinity
      );
      if (char.xp > 0) gameActions.gainXp(char.xp);
    };

    const handleFeedRequest = (e: any) => {
      const { type } = e.detail;
      vizzyOrchestrator.feed(type);
    };

    const handleTestLanding = (e: any) => {
      handleLaunchLandingGame(e.detail);
    };

    window.addEventListener('character-created', handleCreated);
    window.addEventListener('ui-feed-request', handleFeedRequest);
    window.addEventListener('trigger-test-landing', handleTestLanding);
    return () => {
      window.removeEventListener('character-created', handleCreated);
      window.removeEventListener('ui-feed-request', handleFeedRequest);
      window.removeEventListener('trigger-test-landing', handleTestLanding);
    };
  }, [gameActions]);

  const handleGlobalClick = (e: React.MouseEvent) => {
    if (flightState !== 'idle' || showLandingGame) return;
    const xPct = (e.clientX / window.innerWidth) * 100;
    const yPct = (e.clientY / window.innerHeight) * 100;
    setRippleOrigin({ x: `${xPct}%`, y: `${yPct}%` });
  };

  const abortFlightMode = () => {
    abortWarp();
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
    document.exitPointerLock?.();

    const addressParts = (target.address || 'G1-S1-O1').split('-');
    const galaxy = addressParts[0] || 'G1';
    const system = addressParts[1] || 'S1';
    const object = addressParts[2] || 'O1';

    const targetAddress = [galaxy, system, object].join('-');
    const hasVisited = PersistenceService.hasVisited(targetAddress);

    const context: LandingContext = {
      id: target.id,
      ship: {
        model: 'fighter',
        position: { x: target.position?.[0] || 0, y: target.position?.[1] || 8000, z: target.position?.[2] || 0 },
        velocity: { x: target.velocity?.[0] || 0, y: target.velocity?.[1] || -50, z: target.velocity?.[2] || 0 },
        heading: target.heading || 0,
        health: 100,
        shieldLevel: 100,
      },
      destination: {
        galaxy, system, object,
        civ: 1, city: 1, region: 1,
        address: targetAddress,
        name: target.name,
      },
      firstVisit: !hasVisited,
      timestamp: Date.now(),
    };

    if (hasVisited) {
      console.log('[Dawn] Skipping landing - location already visited:', targetAddress);
      setTimeout(() => {
        loadWorldAssets(target.id, galaxy, system, object);
        handleLandingGameComplete(true);
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

  // Dev Overlay Toggle
  const toggleDevOverlay = () => setShowDevOverlay(prev => !prev);

  const dawnUi = (
    <div
      className="flex flex-col h-screen w-screen bg-[#020202] text-cyan-50 select-none overflow-auto relative custom-scrollbar"
      onClickCapture={handleGlobalClick}
      style={{ perspective: '2000px' }}
    >
      <Starfield flightState={flightState} />

      {/* LASER POINTER DOT */}
      {laserActive && (
        <div
          className="fixed w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_4px_rgba(255,0,0,0.9)] z-[99999] pointer-events-none"
          style={{
            left: laserPos.x,
            top: laserPos.y,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px 2px rgba(255, 50, 50, 0.8), 0 0 20px 10px rgba(255, 0, 0, 0.4)'
          }}
        />
      )}

      {/* VIZZY LAYER: Procedural 3D Object */}
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

      {/* DEV COMMANDS OVERLAY */}
      <DevOverlay show={showDevOverlay} />

      {/* PRIMARY UI CONTAINER */}
      <div
        className="relative z-10 flex flex-col h-full w-full transform-style-3d transition-all duration-[4000ms] cubic-bezier(0.4, 0, 0.2, 1)"
        style={{
          transform: flightState === 'idle'
            ? 'translateZ(0)'
            : 'translateZ(1200px)',
          opacity: flightState === 'flying' ? 0 : 1,
          pointerEvents: isUIActive ? 'auto' : 'none'
        }}
      >
        <Header onLaunchFlight={initiateWarp} onToggleDev={toggleDevOverlay} />

        <main className="flex-1 overflow-hidden relative w-full box-border transform-style-3d">
          <MainGrid
            onFlightMode={initiateWarp}
            activeChatTarget={activeChatTarget}
            setActiveChatTarget={setActiveChatTarget}
            chatInjection={null}
            devTerminalOpen={devTerminalOpen}
            setDevTerminalOpen={setDevTerminalOpen}
          />
        </main>

        <Footer />
      </div>
    </div>
  );

  return (
    <div className="relative w-screen h-screen bg-black">
      <div className={`h-full w-full transition-opacity duration-1000 ${!isUIActive ? 'opacity-0' : 'opacity-100'}`}>
        <ColorStealingProvider>
          <SimProvider>
            {dawnUi}
          </SimProvider>
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
              } else {
                gameActions.addItem({
                  id: item,
                  name: item.replace('_', ' '),
                  type: item === 'NANITE_KIT' ? 'consumable' : 'RESOURCE',
                  rarity: 'common',
                  count: amount || 1
                });
              }
              gameActions.gainXp(50);
            }}
            onEnemyDestroyed={(tier, enemyId) => {
              gameActions.recordKill('FLIGHT', tier as any, enemyId, state.address.full || 'G1-S1');
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
