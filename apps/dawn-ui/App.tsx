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
import { getDirectory } from 'eideus-routers';
import { PersistenceService } from './src/services/PersistenceService';
import { FeederDock } from './components/Panels/FeederDock';
import { vizzyOrchestrator } from './src/services/VizzyOrchestrator';
import { ColorStealingProvider } from './src/contexts/ColorStealingContext';
import { SimProvider } from './src/context/SimContext';

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
  const [activeChatTarget, setActiveChatTarget] = useState<'navbot' | 'vizzy' | 'lyra'>('navbot'); // Lifted state

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(t => window.clearTimeout(t));
    timersRef.current = [];
  };

  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const scrollHistory = useRef<number[]>([]);
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // LASER POINTER EASTER EGG
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Ignore if interacting with UI inputs
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const now = Date.now();
      // Reset sequence if more than 0.5s passes between scrolls (must be rapid)
      if (now - lastScrollTime.current > 500) {
        scrollHistory.current = [];
      }
      lastScrollTime.current = now;

      const dir = Math.sign(e.deltaY);

      // Simple Logic: Only care if direction CHANGED from last input
      const lastDir = scrollHistory.current[scrollHistory.current.length - 1];
      if (dir !== 0 && dir !== lastDir) {
        scrollHistory.current.push(dir);
      }

      // Reduced Requirement: Just 5 alternations (Up-Down-Up-Down-Up)
      if (scrollHistory.current.length >= 5) {
        console.log("LASER MODE ACTIVATED!");
        setLaserActive(true);
        scrollHistory.current = [];
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle Laser Interaction
  useEffect(() => {
    if (!laserActive) {
      window.dispatchEvent(new CustomEvent('vizzy-laser-update', { detail: { active: false, x: 0, y: 0 } }));
      // Remove global cursor override if it exists
      const existingStyle = document.getElementById('laser-cursor-style');
      if (existingStyle) existingStyle.remove();
      return;
    }

    // FORCE HIDE CURSOR GLOBALLY
    // We inject a style tag because specific elements (buttons/inputs) will override body cursor
    const style = document.createElement('style');
    style.id = 'laser-cursor-style';
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const handleMove = (e: MouseEvent) => {
      setLaserPos({ x: e.clientX, y: e.clientY });
      // Normalize for Vizzy (-1 to 1)
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      window.dispatchEvent(new CustomEvent('vizzy-laser-update', { detail: { active: true, x: normX, y: normY } }));
    };

    const handleExit = () => setLaserActive(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleExit);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') handleExit(); });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleExit);
      const existingStyle = document.getElementById('laser-cursor-style');
      if (existingStyle) existingStyle.remove();
    };
  }, [laserActive]);

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

  // Dev Overlay Toggle
  const [showDevOverlay, setShowDevOverlay] = useState(false);
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

      {/* DEV COMMANDS OVERLAY (TOGGLEABLE) */}
      <DevOverlay show={showDevOverlay} />

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
        {/* FeederDock REMOVED */}

        {/* Header: Tilts up and away */}
        <div
          className="transition-all duration-[2000ms] ease-in-out"
          style={{
            transform: flightState !== 'idle' ? 'rotateX(-90deg) translateY(-200px)' : 'none',
            transformOrigin: 'top center',
            opacity: flightState !== 'idle' ? 0 : 1
          }}
        >
          <Header onLaunchFlight={initiateWarpSequence} onToggleDev={toggleDevOverlay} />
        </div>

        <main className="flex-1 overflow-hidden relative w-full box-border transform-style-3d">
          <MainGrid
            onFlightMode={initiateWarpSequence}
            activeChatTarget={activeChatTarget} // Passed through
            setActiveChatTarget={setActiveChatTarget} // Passed through
            chatInjection={null}
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

const DevOverlay: React.FC<{ show: boolean }> = ({ show }) => {
  const [betaStage, setBetaStage] = useState(0); // 0=Home, 1=Class, 2=Affinity, 3=Turns
  const [betaClass, setBetaClass] = useState('');
  const [betaAffinity, setBetaAffinity] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [customCommand, setCustomCommand] = useState('');

  const execute = (cmd: string) => {
    window.dispatchEvent(new CustomEvent('execute-dev-command', { detail: cmd }));
  };

  const handleBetaReset = () => {
    setBetaStage(0);
    setBetaClass('');
    setBetaAffinity('');
    setIsCustomInput(false);
    setInputValue('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute(`${customCommand} ${inputValue}`);
    setIsCustomInput(false);
    setInputValue('');
    setCustomCommand('');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-8 z-[200] font-mono text-[10px] text-cyan-300 transition-opacity duration-300 pointer-events-auto">
      <div className="bg-black/90 backdrop-blur-md p-4 rounded border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] min-w-[200px] flex flex-col gap-2">
        <h3 className="font-bold text-cyan-100 border-b border-cyan-800 pb-1 flex justify-between items-center">
          <span>DEV PROTOCOLS</span>
          {betaStage > 0 && (
            <button onClick={handleBetaReset} className="text-red-400 hover:text-red-300 text-[9px] uppercase tracking-wider">
              [RESET]
            </button>
          )}
          <span className="text-[9px] text-cyan-600">v0.9.5</span>
        </h3>

        {/* MAIN MENU */}
        {betaStage === 0 && !isCustomInput && (
          <div className="grid grid-cols-2 gap-2">
            <DevButton label="TEST HEIST (VISUAL)" onClick={() => window.dispatchEvent(new CustomEvent('vizzy-logic-steal', { detail: {} }))} color="red" />
            <DevButton label="BETA TEST WIZARD" onClick={() => setBetaStage(1)} color="yellow" />
            <DevButton label="STOP BOT" onClick={() => execute('/stop-bot')} color="red" />
            <DevButton label="LANDING GAME" onClick={() => execute('/landing-game')} />
            <DevButton label="WARP..." onClick={() => { setCustomCommand('/warp'); setIsCustomInput(true); }} />
            <DevButton label="TELEMETRY" onClick={() => execute('/telemetry')} />
            <DevButton label="SIM COMBAT (5)" onClick={() => execute('/sim-combat 5')} />
            <DevButton label="SPAWN LOOT" onClick={() => execute('/spawn-loot RARE')} />
            <DevButton label="FORCE LEVEL..." onClick={() => { setCustomCommand('/force-level'); setIsCustomInput(true); }} />
            <DevButton label="QUEST STATUS" onClick={() => execute('/quest-status')} />
            <DevButton label="TRIGGER HEIST" onClick={() => window.dispatchEvent(new CustomEvent('vizzy-logic-steal', { detail: {} }))} color="yellow" />
            <DevButton label="SAVE GAME" onClick={() => execute('/save')} color="green" />
            <DevButton label="RESET SAVE" onClick={() => execute('/reset-save')} color="red" />
            <DevButton label="EXPORT LOGS" onClick={() => execute('/export-logs')} />
          </div>
        )}

        {/* CUSTOM INPUT (Warp, Level) */}
        {isCustomInput && (
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-2">
            <div className="text-cyan-400">{customCommand} [ARG]</div>
            <input
              autoFocus
              className="bg-black/50 border border-cyan-700 text-cyan-100 p-1 rounded focus:border-cyan-400 outline-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Value..."
            />
            <div className="flex gap-2">
              <DevButton label="CANCEL" onClick={() => { setIsCustomInput(false); setCustomCommand(''); }} color="red" />
              <DevButton label="EXECUTE" onClick={(e: any) => handleCustomSubmit(e)} color="green" />
            </div>
          </form>
        )}

        {/* BETA WIZARD: STAGE 1 - CLASS */}
        {betaStage === 1 && (
          <div className="flex flex-col gap-2">
            <div className="text-yellow-400 font-bold">SELECT CLASS</div>
            <DevButton label="REBEL" onClick={() => { setBetaClass('REBEL'); setBetaStage(2); }} />
            <DevButton label="ACOLYTE" onClick={() => { setBetaClass('ACOLYTE'); setBetaStage(2); }} />
            <DevButton label="HACKER" onClick={() => { setBetaClass('HACKER'); setBetaStage(2); }} />
          </div>
        )}

        {/* BETA WIZARD: STAGE 2 - AFFINITY */}
        {betaStage === 2 && (
          <div className="flex flex-col gap-2">
            <div className="text-yellow-400 font-bold">SELECT AFFINITY</div>
            <DevButton label="STR (Strength)" onClick={() => { setBetaAffinity('STR'); setBetaStage(3); }} />
            <DevButton label="INT (Intelligence)" onClick={() => { setBetaAffinity('INT'); setBetaStage(3); }} />
            <DevButton label="DEX (Dexterity)" onClick={() => { setBetaAffinity('DEX'); setBetaStage(3); }} />
          </div>
        )}

        {/* BETA WIZARD: STAGE 3 - TURNS */}
        {betaStage === 3 && (
          <div className="flex flex-col gap-2">
            <div className="text-yellow-400 font-bold">TURN LIMIT</div>
            <input
              autoFocus
              type="number"
              className="bg-black/50 border border-cyan-700 text-cyan-100 p-1 rounded focus:border-cyan-400 outline-none"
              placeholder="Enter turns (e.g. 50)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const turns = parseInt(e.currentTarget.value) || 0;
                  execute(`/beta-test ${betaClass} ${betaAffinity} ${turns}`);
                  handleBetaReset();
                }
              }}
            />
            <div className="text-[9px] text-cyan-600">Press ENTER to launch</div>
          </div>
        )}
      </div>
    </div>
  );
};

const DevButton: React.FC<{ label: string; onClick: React.MouseEventHandler<HTMLButtonElement>; color?: 'cyan' | 'red' | 'yellow' | 'green' }> = ({ label, onClick, color = 'cyan' }) => {
  const colors = {
    cyan: 'border-cyan-800 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-500 hover:text-cyan-100',
    red: 'border-red-900 text-red-400 hover:bg-red-900/50 hover:border-red-500 hover:text-red-100',
    yellow: 'border-yellow-900 text-yellow-400 hover:bg-yellow-900/50 hover:border-yellow-500 hover:text-yellow-100',
    green: 'border-green-900 text-green-400 hover:bg-green-900/50 hover:border-green-500 hover:text-green-100',
  };
  return (
    <button
      onClick={onClick}
      className={`border px-2 py-1.5 rounded transition-all text-left uppercase tracking-wider text-[9px] ${colors[color]}`}
    >
      {label}
    </button>
  );
};

export default App;
