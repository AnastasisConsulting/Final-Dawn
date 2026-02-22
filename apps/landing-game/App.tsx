import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { SpaceFighter } from './components/SpaceFighter';
import { Environment } from './components/Environment';
import { SolarSystem } from './components/SolarSystem';
import { CombatSystem } from './components/CombatSystem';
import { Interface } from './components/Interface';
import { TrafficSystem } from './components/TrafficSystem';
import { SystemNode, FlightStatus, MissionState, CinematicState, PlayerData, NotificationItem, AtmosphericCondition, TargetDynamics, Target, TrafficUnit, BuildingData, WeatherType, LandingZone, RuralRegion } from './types';
import { playImpactSound } from './utils/audio';
import { getHeight, getTerrainPoint } from './utils/terrain';

// --- DATA ---
const INITIAL_SYSTEM: SystemNode = {
    id: 'sol-prime', name: 'SOL PRIME', type: 'SYSTEM', radius: 800, color: '#f59e0b',
    children: [
        { id: 'p1', name: 'AERION', type: 'PLANET', radius: 300, color: '#3b82f6' },
        { id: 'p2', name: 'VULCAN', type: 'PLANET', radius: 400, color: '#ef4444' }
    ]
};

const INITIAL_LANDING_ZONES: LandingZone[] = [
    { id: 'alpha', name: 'METROPOLIS ALPHA', position: [10000, 0, 10000] },
    { id: 'beta', name: 'INDUSTRIAL SECTOR', position: [-13300, 0, 3300] },
    { id: 'gamma', name: 'OUTPOST GAMMA', position: [0, 0, -16600] }
];

export default function App({ landingContext: initialContext, onLandingComplete, onTakeoffComplete }: any) {
    // --- STATE ---
    const [status, setStatus] = useState<FlightStatus>({
        speed: 0, altitude: 8500, heading: 0, position: [0, 8500, 8000], flightAssist: true, weaponLevel: 0, shieldActive: true, isLanded: false
    });
    const [paused, setPaused] = useState(true); // Start Paused
    const [mission, setMission] = useState<MissionState>({ activeQuest: null });
    const [playerData, setPlayerData] = useState<PlayerData>({ credits: 1000, weaponLevel: 0, reputation: 0 });
    const [activeSystem, setActiveSystem] = useState<SystemNode>(INITIAL_SYSTEM);
    const [dockingTarget, setDockingTarget] = useState<SystemNode | null>(null);
    const [cinematic, setCinematic] = useState<CinematicState>({ active: false, type: 'NONE', targetPosition: null });
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [gameWon, setGameWon] = useState(false);

    const [heatLevel, setHeatLevel] = useState(0);
    const [pendingLanding, setPendingLanding] = useState(false);
    const [targets, setTargets] = useState<Target[]>([]);
    const [isBoosting, setIsBoosting] = useState(false);
    const [inAtmosphere, setInAtmosphere] = useState(true);
    const [activeLandingZoneId, setActiveLandingZoneId] = useState('alpha');
    const [weather, setWeather] = useState<WeatherType>('CLEAR');
    const [landingCount, setLandingCount] = useState(0);
    const [worldData, setWorldData] = useState<{ landingZones: (LandingZone & { ruralRegions: RuralRegion[] })[] }>({
        landingZones: INITIAL_LANDING_ZONES.map(lz => ({ ...lz, ruralRegions: [] }))
    });

    // --- REFS ---
    const targetDynamicsRef = useRef<TargetDynamics>({ position: new Vector3(), velocity: new Vector3() });
    const fireFnRef = useRef<any>(null);
    const trafficRef = useRef<TrafficUnit[]>([]);
    const buildingsRef = useRef<BuildingData[]>([]);

    // --- INIT CITY DATA & RURAL REGIONS ---
    useEffect(() => {
        const buildings: BuildingData[] = [];
        const regions: (LandingZone & { ruralRegions: RuralRegion[] })[] = [];

        INITIAL_LANDING_ZONES.forEach(city => {
            const cityRuralRegions: RuralRegion[] = [];
            const cityPos = new Vector3(...city.position);
            city.position[1] = getHeight(city.position[0], city.position[2]); // Snap city to terrain

            // Generate 8 rural regions per city
            for (let r = 0; r < 8; r++) {
                const angle = (r / 8) * Math.PI * 2 + Math.random();
                const dist = 8000 + Math.random() * 7000;
                const rx = city.position[0] + Math.cos(angle) * dist;
                const rz = city.position[2] + Math.sin(angle) * dist;
                const ry = getHeight(rx, rz);

                const region: RuralRegion = {
                    id: `${city.id}-rural-${r}`,
                    position: [rx, ry, rz],
                    type: r % 3 === 0 ? 'FARM' : r % 3 === 1 ? 'MINING' : 'RESEARCH'
                };
                cityRuralRegions.push(region);

                // Populate Rural Region with sparse buildings
                const buildingCount = 40 + Math.floor(Math.random() * 30);
                for (let b = 0; b < buildingCount; b++) {
                    const bAngle = Math.random() * Math.PI * 2;
                    const bDist = Math.random() * 400;
                    const bx = rx + Math.cos(bAngle) * bDist;
                    const bz = rz + Math.sin(bAngle) * bDist;
                    const bh = 20 + Math.random() * 40;
                    const bw = 15 + Math.random() * 20;

                    buildings.push({
                        position: new Vector3(bx, getHeight(bx, bz) + bh / 2 - 5, bz),
                        width: bw, height: bh, depth: bw,
                        rotationY: Math.random() * Math.PI,
                        regionId: region.id
                    });
                }
            }
            regions.push({ ...city, ruralRegions: cityRuralRegions });

            // Populate Main City (Denser and Larger)
            const mainBuildingCount = 1000;
            for (let b = 0; b < mainBuildingCount; b++) {
                const r = (Math.random() + Math.random()) / 2 * 3500;
                const angle = Math.random() * Math.PI * 2;
                const bx = city.position[0] + Math.cos(angle) * r;
                const bz = city.position[2] + Math.sin(angle) * r;

                // --- CLEARANCE LOGIC ---
                // 1. Clear 250u Circle around Pad
                const distToPad = Math.sqrt(Math.pow(bx - city.position[0], 2) + Math.pow(bz - city.position[2], 2));
                if (distToPad < 250) continue;

                // 2. Clear Approach Path (Corridor)
                // Let's clear a 150u wide path along the Z axis (coming from "outside")
                const relativeX = bx - city.position[0];
                const relativeZ = bz - city.position[2];
                // Corridor from Z+ direction (south approach)
                if (Math.abs(relativeX) < 150 && relativeZ > 0) continue;

                const bh = 50 + Math.random() * 300 + (1 - r / 3500) * 800; // Taller buildings in center
                const bw = 30 + Math.random() * 50;

                buildings.push({
                    position: new Vector3(bx, getHeight(bx, bz) + bh / 2 - 10, bz),
                    width: bw, height: bh, depth: bw,
                    rotationY: Math.random() * Math.PI,
                    regionId: city.id
                });
            }
        });

        buildingsRef.current = buildings;
        setWorldData({ landingZones: regions });
    }, []);

    // --- LOGIC ---


    const addNotification = (msg: string, type: 'INFO' | 'WARNING' | 'LOOT' = 'INFO') => {
        const id = Math.random().toString();
        setNotifications(prev => [...prev, { id, message: msg, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
    };

    const handleFire = (pos: Vector3, quat: Quaternion, type: any, vel: Vector3) => {
        if (fireFnRef.current && !paused) fireFnRef.current(pos, quat, type, status.weaponLevel, vel);
    };

    const handleDock = () => {
        if (dockingTarget?.type === 'PLANET') {
            setCinematic({ active: true, type: 'LANDING', targetPosition: null, message: 'ENTERING ATMOSPHERE' });
            setTimeout(() => {
                setInAtmosphere(true);
                setCinematic({ active: false, type: 'NONE', targetPosition: null });
                addNotification("ATMOSPHERIC ENTRY COMPLETE", "INFO");
                addNotification("LOCAL SECURITY: STATUS CLEAR", "INFO");
                setHeatLevel(0);
            }, 3000);
        }
    };

    const handleCrash = () => {
        // Called when hitting ground or buildings hard
        addNotification("CRITICAL COLLISION ALERT", "WARNING");
        setPlayerData(p => ({ ...p, credits: Math.max(0, p.credits - 250) }));
        setHeatLevel(h => Math.min(100, h + 5)); // Clumsy flying attracts attention
    };

    const handleCollisionHeat = (amount: number, message: string) => {
        setHeatLevel(h => Math.min(100, h + amount));
        addNotification(message, "WARNING");
        setPlayerData(p => ({ ...p, credits: Math.max(0, p.credits - 500) }));
    };

    const handleCivilianKill = () => {
        setHeatLevel(h => Math.min(100, h + 40));
        addNotification("CIVILIAN CASUALTY DETECTED", "WARNING");
        addNotification("POLICE DRONES DISPATCHED", "WARNING");
        setPlayerData(p => ({ ...p, credits: Math.max(0, p.credits - 1000) }));
    };


    const handleLandingAttempt = () => {
        if (isSafeToLand) {
            setPendingLanding(false);
            setCinematic({ active: true, type: 'LANDING', targetPosition: closestLZ.position });
            setLandingCount(prev => prev + 1);

            // Weather cycle: Every 3rd landing is a storm
            if ((landingCount + 1) % 3 === 0) {
                setWeather('STORM');
                addNotification("SEVERE WEATHER WARNING: STORM INCOMING", "WARNING");
            } else {
                setWeather('CLEAR');
            }

            setTimeout(() => {
                setGameWon(true);
                setStatus(prev => ({ ...prev, isLanded: true }));
                addNotification("LANDING SECURED. SYSTEMS STANDBY.", "INFO");
                addNotification("PRESS 'T' TO INITIATE TAKEOFF.", "INFO");
                onLandingComplete(true);
            }, 8000);
        }
    };

    const closestLZ = worldData.landingZones.reduce((prev, curr) => {
        const distPrev = Math.sqrt(Math.pow(status.position[0] - prev.position[0], 2) + Math.pow(status.position[2] - prev.position[2], 2));
        const distCurr = Math.sqrt(Math.pow(status.position[0] - curr.position[0], 2) + Math.pow(status.position[2] - curr.position[2], 2));
        return distCurr < distPrev ? curr : prev;
    });
    const distToClosest = Math.sqrt(Math.pow(status.position[0] - closestLZ.position[0], 2) + Math.pow(status.position[2] - closestLZ.position[2], 2));

    const isSafeToLand = inAtmosphere && heatLevel < 5 && targets.length === 0 && Math.abs(status.speed) < 500 && status.altitude < 800 && distToClosest < 350;

    const atmosphereCondition: AtmosphericCondition = {
        inAtmosphere,
        planetName: dockingTarget?.name || 'AERION PRIME',
        visibility: weather === 'STORM' ? 0.3 : 0.8,
        windSpeed: weather === 'STORM' ? 100 : 20,
        weather,
        landingZones: worldData.landingZones,
        activeLandingZoneId,
        isSafeToLand
    };

    const activeLZ = worldData.landingZones.find(lz => lz.id === activeLandingZoneId) || worldData.landingZones[0];
    const distToLZ = Math.sqrt(
        Math.pow(status.position[0] - activeLZ.position[0], 2) +
        Math.pow(status.position[2] - activeLZ.position[2], 2)
    );

    useEffect(() => {
        const handleLockChange = () => {
            setPaused(!document.pointerLockElement);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyL' && pendingLanding) {
                handleLandingAttempt();
            }
            if (e.code === 'KeyT' && status.isLanded && !cinematic.active) {
                handleTakeoffInitiated();
            }
        };
        document.addEventListener('pointerlockchange', handleLockChange);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerlockchange', handleLockChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [pendingLanding, isSafeToLand]);

    const handleTakeoffInitiated = () => {
        setCinematic({ active: true, type: 'TAKEOFF', targetPosition: [status.position[0], 25000, status.position[2]], message: 'INITIATING ASCENT' });
        setStatus(prev => ({ ...prev, isLanded: false }));
        addNotification("TAKEOFF SEQUENCE ENGAGED", "INFO");
    };

    const handleHandoffToSpace = () => {
        if (onTakeoffComplete) {
            onTakeoffComplete({
                address: initialContext?.destination?.address || 'G1-S1-O1',
                name: initialContext?.destination?.name || 'UNKNOWN',
                position: status.position,
                heading: status.heading
            });
        }
    };

    return (
        <div className="relative w-full h-full">
            <Canvas shadows camera={{ far: 100000, fov: 60, position: [0, 3550, 100] }}>
                <Environment
                    isBoosting={isBoosting}
                    mode={inAtmosphere ? 'ATMOSPHERE' : 'SPACE'}
                    landingZones={atmosphereCondition.landingZones}
                    activeLandingZoneId={activeLandingZoneId}
                    atmosphereColor="#38bdf8"
                    buildings={buildingsRef.current}
                    weather={weather}
                />

                {inAtmosphere && (
                    <TrafficSystem
                        count={300}
                        trafficRef={trafficRef}
                        paused={paused}
                        worldData={worldData}
                        weather={weather}
                    />
                )}

                {!inAtmosphere && (
                    <SolarSystem
                        system={activeSystem}
                        shipPosition={new Vector3(...status.position)}
                        onDockingTargetChange={setDockingTarget}
                        dockingTargetId={dockingTarget?.id || null}
                        targetDynamicsRef={targetDynamicsRef}
                        visible={!inAtmosphere}
                    />
                )}

                <SpaceFighter
                    status={status}
                    onUpdateStatus={setStatus}
                    onFire={handleFire}
                    navTarget={null}
                    autopilot={gameWon}
                    onAutopilotDisengage={() => { }}
                    activeSystem={activeSystem}
                    playerHealth={100}
                    cinematicMode={cinematic}
                    dockingTarget={inAtmosphere ? null : dockingTarget}
                    targetDynamicsRef={targetDynamicsRef}
                    activeTargets={targets}
                    onChaff={() => { }}
                    targetingStatus={{ locked: heatLevel > 50, missileTracking: heatLevel > 80 }}
                    onBoostChange={setIsBoosting}
                    inAtmosphere={inAtmosphere}
                    onCrash={handleCrash}
                    paused={paused}
                    buildingsRef={buildingsRef}
                    trafficRef={trafficRef}
                    onHeatIncrease={handleCollisionHeat}
                    onTakeoffComplete={handleHandoffToSpace}
                />

                <CombatSystem
                    registerFireFn={(fn) => fireFnRef.current = fn}
                    targetTextureUrl={null}
                    playerPos={new Vector3(...status.position)}
                    onPickup={() => { }}
                    onDistressSignal={() => { }}
                    chaffActive={false}
                    onEnemyDestroyed={(t) => {
                        setHeatLevel(h => h + 10);
                        addNotification(t.enemyType === 'POLICE' ? "POLICE DRONE DESTROYED" : "TARGET NEUTRALIZED", "INFO");
                    }}
                    onTargetingStatusChange={() => { }}
                    weaponLevel={status.weaponLevel}
                    onHeatChange={(val) => setHeatLevel(prev => Math.max(0, Math.min(100, prev + val)))}
                    onPlayerHit={() => {
                        setHeatLevel(h => Math.min(100, h + 5));
                        playImpactSound();
                    }}
                    setCinematic={setCinematic}
                    onTargetsUpdate={setTargets}
                    inAtmosphere={inAtmosphere}
                    paused={paused}
                    trafficRef={trafficRef}
                    onCivilianKilled={handleCivilianKill}
                    heatLevel={heatLevel}
                />
            </Canvas>

            <Interface
                status={status}
                mission={mission}
                onRequestMission={() => { }}
                activeSystem={activeSystem}
                dockingTarget={dockingTarget}
                onDock={handleDock}
                cinematic={cinematic}
                playerData={playerData}
                heatLevel={heatLevel}
                notifications={notifications}
                atmosphericCondition={atmosphereCondition}
                onAttemptLanding={handleLandingAttempt}
                activeTargets={targets}
                gameWon={gameWon}
                distToLZ={distToLZ}
                onSetActiveLandingZoneId={setActiveLandingZoneId}
                pendingLanding={pendingLanding}
                onCancelLanding={() => setPendingLanding(false)}
            />
        </div>
    );
}