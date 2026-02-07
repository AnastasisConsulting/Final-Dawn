/// <reference path="./three-elements.d.ts" />
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
// Force rebuild
import { Canvas } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { Environment } from './components/Environment';
import { Aircraft } from './components/Aircraft';
import { Interface } from './components/Interface';
import { CombatSystem } from './components/CombatSystem';
import { Universe } from './components/Universe';
import { SolarSystem } from './components/SolarSystem';
import { FlightStatus, MissionState, WeaponType, SystemNode, Target, CinematicState, TargetDynamics, NavBotState, PlayerData, PickupType, NotificationItem, FlightAppProps } from './types';
import { generateNavBotComment, generateDistressSignal } from './services/geminiService';
import { universeTree } from './data/universe';
import { computeUniverseLayout } from './utils/universeLayout';
import { loadGame, saveGame, generateQuest, INITIAL_PLAYER_DATA, ACHIEVEMENTS } from './utils/progression';
import { playCreditSound, playLootSound, playAchievementSound, playImpactSound } from './utils/audio';

const App: React.FC<FlightAppProps> = ({
    handoffToken,
    onHandoffComplete,
    onLaunchLandingGame,
    onLootAcquired,
    onEnemyDestroyed,
    onStoryXpAwarded,
    systemId
}) => {
    const [status, setStatus] = useState<FlightStatus>({
        speed: 0,
        altitude: 0,
        heading: 0,
        position: [0, 0, 0],
        flightAssist: true,
        weaponLevel: 0,
        shieldActive: false
    });

    const [mission, setMission] = useState<MissionState>({
        activeQuest: null,
        messageLog: []
    });

    // Persistent Player Data
    const [playerData, setPlayerData] = useState<PlayerData>(INITIAL_PLAYER_DATA);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [heatLevel, setHeatLevel] = useState(1.0);

    const [loading, setLoading] = useState(false);
    const [targetTexture, setTargetTexture] = useState<string | null>(null);

    // RPG State - Buffed base health for better gameplay flow
    const [playerHealth, setPlayerHealth] = useState(500);
    const [shieldTimer, setShieldTimer] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [combatKey, setCombatKey] = useState(0);

    // Navigation State
    const [navTarget, setNavTarget] = useState<SystemNode | null>(null);
    const [autopilot, setAutopilot] = useState(false);

    // Cinematic / Rescue State
    const [cinematic, setCinematic] = useState<CinematicState>({
        active: false,
        targetPosition: null
    });

    // System View State
    const [activeSystem, setActiveSystem] = useState<SystemNode | null>(null);
    const [dockingTarget, setDockingTarget] = useState<SystemNode | null>(null);

    // Shared ref for celestial body dynamics (position/velocity)
    const targetDynamicsRef = useRef<TargetDynamics>({ position: new Vector3(), velocity: new Vector3() });

    // Combat State
    const [activeTargets, setActiveTargets] = useState<Target[]>([]);
    const [chaffActive, setChaffActive] = useState(false);

    // NavBot
    const [navBot, setNavBot] = useState<NavBotState>({ active: false, message: '', opacity: 0 });

    // Targeting Alert State
    const [targetingStatus, setTargetingStatus] = useState({ locked: false, missileTracking: false });

    // Landing Mode State
    const [isLanding, setIsLanding] = useState(false);
    const [hasSuccessfulLanding, setHasSuccessfulLanding] = useState(false);
    const [isAutoLanding, setIsAutoLanding] = useState(false);

    const universeLayout = useMemo(() => computeUniverseLayout(universeTree), []);

    useEffect(() => {
        const saved = loadGame();
        setPlayerData(saved);
        setMission(prev => ({ ...prev, activeQuest: generateQuest(saved.weaponLevel) }));
        const hasLanded = localStorage.getItem('gemini_flight_landed') === 'true';
        setHasSuccessfulLanding(hasLanded);

        if (!activeSystem) {
            let system;
            if (systemId) {
                // Try to find by id or locKey
                for (const galaxy of universeLayout) {
                    system = galaxy.children?.find(s => s.id === systemId || s.locKey === systemId);
                    if (system) break;
                }
            }

            if (!system) {
                const galaxy = universeLayout.find(g => g.name === "The Core Syndicate");
                system = galaxy?.children?.find(s => s.name === "Aura-507");
            }

            if (system) {
                setActiveSystem(system);
                setStatus(prev => ({ ...prev, position: [0, 2000, -12000], heading: 180 }));
            }
        }

        if (handoffToken && onHandoffComplete) {
            console.log('[Flight] Handoff detected, token:', handoffToken);
            onHandoffComplete();
        }
    }, [universeLayout, handoffToken, onHandoffComplete, activeSystem]);

    useEffect(() => {
        let interval: any;
        if (shieldTimer > 0) {
            setStatus(s => ({ ...s, shieldActive: true }));
            interval = setInterval(() => {
                setShieldTimer(prev => {
                    if (prev <= 1) {
                        setStatus(s => ({ ...s, shieldActive: false }));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setStatus(s => ({ ...s, shieldActive: false }));
        }
        return () => clearInterval(interval);
    }, [shieldTimer]);

    useEffect(() => {
        if (dockingTarget && document.pointerLockElement) {
            console.log('[Flight] Docking target detected, releasing pointer lock.');
            document.exitPointerLock();
        }
    }, [dockingTarget]);

    const addNotification = (type: NotificationItem['type'], message: string, subtext?: string) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, type, message, subtext }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    const fireRef = useRef<(pos: Vector3, quat: Quaternion, type: WeaponType, level: number, initialVel: Vector3) => void>(() => { });
    const registerFireFn = useCallback((fn: (pos: Vector3, quat: Quaternion, type: WeaponType, level: number, initialVel: Vector3) => void) => {
        fireRef.current = fn;
    }, []);

    const handleUpdateStatus = useCallback((newStatus: FlightStatus) => {
        if (gameOver) return;
        setStatus(prev => ({
            ...newStatus,
            weaponLevel: playerData.weaponLevel,
            shieldActive: prev.shieldActive
        }));
    }, [playerData.weaponLevel, gameOver]);

    const handleFire = (pos: Vector3, quat: Quaternion, type: WeaponType, velocity: Vector3) => {
        if (fireRef.current && !gameOver) fireRef.current(pos, quat, type, playerData.weaponLevel, velocity);
    };

    const handlePickup = (type: PickupType, value?: number) => {
        if (gameOver) return;
        setPlayerData(prev => {
            const next = { ...prev };
            if (type === 'HEALTH') {
                setPlayerHealth(500); // Restore to full
                addNotification('LOOT', 'HULL REPAIRED', 'Systems Online');
                playLootSound();
            }
            if (type === 'SHIELD') {
                setShieldTimer(30);
                addNotification('LOOT', 'SHIELD OVERCHARGE', '30s Active');
                playLootSound();
            }
            if (type === 'WEAPON') {
                next.weaponLevel = Math.min(next.weaponLevel + 1, 3);
                addNotification('LOOT', 'WEAPON UPGRADE', `Level ${next.weaponLevel + 1}`);
                playLootSound();
            }
            if (type === 'CREDITS') {
                const amt = value || 50;
                next.credits += amt;
                next.stats.totalCreditsEarned += amt;
                addNotification('LOOT', `+${amt} CREDITS`, 'Transfer Complete');
                playCreditSound();
            }
            if (mission.activeQuest?.type === 'COLLECT_SCRAP') handleQuestProgress('COLLECT_SCRAP');

            if (onLootAcquired) {
                onLootAcquired(type, value);
            }

            saveGame(next);
            checkAchievements(next);
            return next;
        });
    };

    const handlePlayerHit = (damage: number) => {
        if (status.shieldActive || gameOver) {
            playImpactSound();
            return;
        }
        setPlayerHealth(prev => {
            const next = prev - damage;
            if (next <= 0) {
                setGameOver(true);
                playImpactSound();
                document.exitPointerLock();
            }
            return next;
        });
    };

    const handleRetry = () => {
        setPlayerHealth(500);
        setGameOver(false);
        setHeatLevel(1.0);
        setCombatKey(k => k + 1);
        setStatus(prev => ({ ...prev, speed: 0, position: [0, 500, 2000] }));
        setActiveTargets([]);
        setTargetingStatus({ locked: false, missileTracking: false });

        const canvas = document.querySelector('canvas');
        canvas?.requestPointerLock();
    };

    const handleQuestProgress = (type: string, tier?: string) => {
        setMission(prev => {
            if (!prev.activeQuest) return prev;
            let progress = 0;
            if (type === 'KILL' && prev.activeQuest.type === 'KILL_COUNT') progress = 1;
            if (type === 'KILL' && tier === 'ELITE' && prev.activeQuest.type === 'KILL_ELITE') progress = 1;
            if (type === 'COLLECT_SCRAP' && prev.activeQuest.type === 'COLLECT_SCRAP') progress = 1;

            if (progress > 0) {
                const newCount = prev.activeQuest.currentCount + progress;
                const completed = newCount >= prev.activeQuest.targetCount;
                if (completed) {
                    setPlayerData(p => {
                        const next = { ...p, credits: p.credits + prev.activeQuest!.rewardCredits };
                        saveGame(next);
                        return next;
                    });
                    addNotification('MISSION', 'CONTRACT COMPLETE', `${prev.activeQuest.rewardCredits} CR Awarded`);
                    playCreditSound();
                    setTimeout(() => {
                        setMission(m => ({ ...m, activeQuest: generateQuest(playerData.weaponLevel + Math.floor(heatLevel)) }));
                    }, 3000);
                    return { ...prev, activeQuest: { ...prev.activeQuest, currentCount: newCount, completed: true } };
                }
                return { ...prev, activeQuest: { ...prev.activeQuest, currentCount: newCount } };
            }
            return prev;
        });
    };

    const checkAchievements = (data: PlayerData) => {
        ACHIEVEMENTS.forEach(ach => {
            if (!data.unlockedAchievements.includes(ach.id) && ach.condition(data.stats)) {
                setPlayerData(prev => {
                    const next = { ...prev, unlockedAchievements: [...prev.unlockedAchievements, ach.id] };
                    saveGame(next);
                    return next;
                });
                addNotification('ACHIEVEMENT', ach.title, ach.description);
                playAchievementSound();
            }
        });
    };

    const handleEnemyDestroyed = (target: Target) => {
        setPlayerData(prev => {
            const next = { ...prev };
            next.stats.totalKills += 1;
            next.stats.highestHeat = Math.max(next.stats.highestHeat, heatLevel);
            saveGame(next);
            checkAchievements(next);
            return next;
        });
        handleQuestProgress('KILL', target.tier);
        if (onEnemyDestroyed) {
            onEnemyDestroyed(target.tier, target.id);
        }
        handleEnemyGroupDestroyed();
    };

    const handleDistressSignal = async (position: Vector3, isAmbush: boolean) => {
        const signalData = await generateDistressSignal();
        const isActualAmbush = isAmbush || signalData.type === 'PIRATE';

        setCinematic({
            active: true,
            targetPosition: position.toArray(),
            message: isActualAmbush ? "SIGNAL SOURCE IDENTIFIED" : "DISTRESS SIGNAL DETECTED",
            transmission: signalData.text,
            type: isActualAmbush ? 'AMBUSH' : 'DISTRESS'
        });
        setTimeout(() => setCinematic(prev => ({ ...prev, active: false })), 6000);
    };

    const toggleAutopilot = () => { if (navTarget) setAutopilot(!autopilot); };
    const initiateLanding = () => {
        if (!dockingTarget) return;
        setIsLanding(true);
        if (onLaunchLandingGame) {
            onLaunchLandingGame({
                id: dockingTarget.id,
                name: dockingTarget.name,
                address: dockingTarget.locKey || 'G1-S1-O1',
                position: status.position,
                velocity: [0, -50, 0],
                heading: status.heading
            });
        }
    };

    const handleAutoLanding = () => {
        if (!dockingTarget) return;
        setIsAutoLanding(true);
        setTimeout(() => { setIsAutoLanding(false); handleLandingComplete(true); }, 4000);
    };

    const handleLandingComplete = (success: boolean) => {
        setIsLanding(false);
        if (success) {
            if (!hasSuccessfulLanding) {
                setHasSuccessfulLanding(true);
                localStorage.setItem('gemini_flight_landed', 'true');
            }
            setStatus(prev => ({ ...prev, speed: 50, position: [0, 500, 3000] }));
            addNotification('MISSION', 'SURFACE SCAN COMPLETE', 'Data Uploaded');

            if (onLaunchLandingGame && dockingTarget) {
                console.log('[Flight] Launching Landing Game for:', dockingTarget.name);
                onLaunchLandingGame({
                    id: dockingTarget.id,
                    name: dockingTarget.name,
                    address: dockingTarget.locKey || 'G1-S1-O1',
                    position: status.position,
                    velocity: [0, -50, 0], // Default entry velocity
                    heading: status.heading
                });
            }
        } else {
            alert("CRASH LANDING DETECTED. SYSTEMS REBOOTING...");
            setStatus(prev => ({ ...prev, speed: 0, position: [0, 500, 2000] }));
        }
    };

    const handleChaff = useCallback(() => {
        setChaffActive(true);
        setTimeout(() => setChaffActive(false), 2000);
    }, []);

    const handleEnemyGroupDestroyed = async () => {
        const msg = await generateNavBotComment();
        setNavBot({ active: true, message: msg, opacity: 1 });
        setTimeout(() => {
            setNavBot(prev => ({ ...prev, opacity: 0 }));
            setTimeout(() => setNavBot(prev => ({ ...prev, active: false })), 500);
        }, 5000);
    };

    const handleSpendCredits = (item: string, cost: number) => {
        if (playerData.credits >= cost) {
            setPlayerData(prev => {
                const next = { ...prev, credits: prev.credits - cost };
                if (item === 'REPAIR') {
                    setPlayerHealth(500);
                    addNotification('LOOT', 'REPAIRS COMPLETE', '-200 CR');
                }
                if (item === 'SHIELD') {
                    setShieldTimer(30);
                    addNotification('LOOT', 'SHIELD PURCHASED', '-300 CR');
                }
                if (item === 'WEAPON') {
                    next.weaponLevel = Math.min(3, next.weaponLevel + 1);
                    addNotification('LOOT', 'WEAPON UPGRADED', 'Firepower Increased');
                }
                saveGame(next);
                return next;
            });
            playLootSound();
        } else {
            addNotification('WARNING', 'INSUFFICIENT CREDITS');
        }
    };

    const shipPosVector = useMemo(() => new Vector3(...status.position), [status.position]);

    return (
        <div className="w-full h-screen bg-black relative">
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 60, far: 50000 }} dpr={[1, 2]}>
                <color attach="background" args={['#02040a']} />

                {!isLanding && (
                    <>
                        <Environment />
                        {activeSystem ? (
                            <SolarSystem
                                system={activeSystem}
                                shipPosition={shipPosVector}
                                onDockingTargetChange={setDockingTarget}
                                dockingTargetId={dockingTarget?.id || null}
                                targetDynamicsRef={targetDynamicsRef}
                            />
                        ) : (
                            <Universe data={universeLayout} />
                        )}

                        {!gameOver && (
                            <CombatSystem
                                key={combatKey}
                                registerFireFn={registerFireFn}
                                targetTextureUrl={targetTexture}
                                onTargetsUpdate={setActiveTargets}
                                playerPos={shipPosVector}
                                onPickup={handlePickup}
                                onDistressSignal={handleDistressSignal}
                                chaffActive={chaffActive}
                                onEnemyDestroyed={handleEnemyDestroyed}
                                onTargetingStatusChange={(locked, missile) => setTargetingStatus({ locked, missileTracking: missile })}
                                weaponLevel={playerData.weaponLevel}
                                onHeatChange={setHeatLevel}
                                onPlayerHit={handlePlayerHit}
                                setCinematic={setCinematic}
                            />
                        )}

                        <Aircraft
                            status={status}
                            onUpdateStatus={handleUpdateStatus}
                            onFire={handleFire}
                            navTarget={navTarget ? new Vector3(...(navTarget.absolutePosition || [0, 0, 0])) : null}
                            autopilot={autopilot || isAutoLanding}
                            onAutopilotDisengage={() => setAutopilot(false)}
                            activeSystem={activeSystem}
                            playerHealth={playerHealth}
                            cinematicMode={cinematic}
                            dockingTarget={dockingTarget}
                            targetDynamicsRef={targetDynamicsRef}
                            activeTargets={activeTargets}
                            onChaff={handleChaff}
                            targetingStatus={targetingStatus}
                        />
                    </>
                )}
            </Canvas>

            {isLanding && dockingTarget && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black">
                    <div className="text-cyan-500 font-mono text-2xl animate-pulse">INITIATING ATMOSPHERIC ENTRY... {dockingTarget.name.toUpperCase()}</div>
                </div>
            )}

            {/* GAME OVER OVERLAY */}
            {gameOver && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-md">
                    <h1 className="text-6xl font-black text-red-500 tracking-tighter mb-4 animate-pulse">CRITICAL FAILURE</h1>
                    <div className="text-xl text-red-200 font-mono mb-8">PILOT LIFE SIGNS TERMINATED</div>
                    <button
                        onClick={handleRetry}
                        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all transform hover:scale-105"
                    >
                        INITIALIZE CLONE / RETRY
                    </button>
                </div>
            )}

            {!isLanding && !gameOver && (
                <Interface
                    status={status}
                    mission={mission}
                    onRequestMission={() => { }}
                    loading={loading}
                    onUploadTexture={setTargetTexture}
                    universeLayout={universeLayout}
                    navTarget={navTarget}
                    onSetNavTarget={setNavTarget}
                    autopilot={autopilot}
                    onToggleAutopilot={toggleAutopilot}
                    activeSystem={activeSystem}
                    dockingTarget={dockingTarget}
                    onDock={initiateLanding}
                    hasSuccessfulLanding={hasSuccessfulLanding}
                    onAutoLand={handleAutoLanding}
                    isAutoLanding={isAutoLanding}
                    activeTargets={activeTargets}
                    cinematic={cinematic}
                    navBot={navBot}
                    playerData={playerData}
                    heatLevel={heatLevel}
                    onSpendCredits={handleSpendCredits}
                    notifications={notifications}
                />
            )}

            {activeSystem && !dockingTarget && !isLanding && !isAutoLanding && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-cyan-500 font-mono text-sm tracking-[0.5em] opacity-80 animate-pulse pointer-events-none">
                    SYSTEM CRUISE: {activeSystem.name.toUpperCase()}
                </div>
            )}
        </div>
    );
};

export default App;
