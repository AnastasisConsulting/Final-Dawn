import React, { useEffect, useState, useRef } from 'react';
import { FlightStatus, MissionState, SystemNode, Target, CinematicState, NavBotState, PlayerData, NotificationItem, AtmosphericCondition } from '../types';
import { requestPointerLock } from './Controls';
import * as THREE from 'three';

interface InterfaceProps {
    status: FlightStatus;
    mission: MissionState;
    onRequestMission: () => void;
    activeSystem: SystemNode | null;
    dockingTarget: SystemNode | null;
    onDock: () => void;
    cinematic?: CinematicState;
    playerData: PlayerData;
    heatLevel: number;
    notifications: NotificationItem[];
    atmosphericCondition: AtmosphericCondition;
    onAttemptLanding: () => void;
    activeTargets?: Target[];
    gameWon?: boolean;
    distToLZ?: number;
    onSetActiveLandingZoneId?: (id: string) => void;
    pendingLanding?: boolean;
    onCancelLanding?: () => void;
}

const Radar: React.FC<{ targets: Target[]; playerHeading: number; playerPos: number[] }> = ({ targets, playerHeading, playerPos }) => {
    return (
        <div className="w-32 h-32 rounded-full bg-black/60 border border-cyan-500/50 relative overflow-hidden backdrop-blur-sm">
            {/* Radar Grid */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 w-full h-[1px] bg-cyan-500"></div>
                <div className="absolute left-1/2 h-full w-[1px] bg-cyan-500"></div>
                <div className="absolute inset-4 rounded-full border border-cyan-500"></div>
            </div>

            {/* Player Pip */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_cyan]"></div>

            {/* Blips */}
            {targets.map(t => {
                const dx = t.position[0] - playerPos[0];
                const dz = t.position[2] - playerPos[2];
                const dist = Math.sqrt(dx * dx + dz * dz);

                // Scale distance to radar size (max 2000 units range)
                const range = 2000;
                if (dist > range) return null;

                const angle = Math.atan2(dx, dz); // World angle

                // Rotate by player heading to get relative position
                const theta = (playerHeading * Math.PI) / 180;
                const relativeX = dx * Math.cos(theta) - dz * Math.sin(theta);
                const relativeZ = dx * Math.sin(theta) + dz * Math.cos(theta);

                // Map to css pixels (center 64,64)
                const px = 64 + (relativeX / range) * 60;
                const py = 64 - (relativeZ / range) * 60; // Invert Z for screen Y

                return (
                    <div
                        key={t.id}
                        className={`absolute w-1.5 h-1.5 rounded-full ${t.tier === 'BOSS' ? 'bg-purple-500' : 'bg-red-500'}`}
                        style={{ left: px, top: py }}
                    ></div>
                );
            })}
        </div>
    );
};

const ThreatIndicator: React.FC<{ target: Target; playerPos: number[]; camera: THREE.Camera }> = ({ target, playerPos, camera }) => {
    const pos = new THREE.Vector3(...target.position);
    const pPos = new THREE.Vector3(...playerPos);

    // Check if behind
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const toTarget = pos.clone().sub(pPos).normalize();
    const dot = camDir.dot(toTarget);

    if (dot < 0.5) { // Behind or extreme side
        if (dot < -0.2) {
            return (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-pulse">
                    <div className="text-red-500 text-xs font-bold mb-1">BEHIND</div>
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-red-600"></div>
                </div>
            );
        }
    }
    return null;
};

export const Interface: React.FC<InterfaceProps> = ({
    status,
    mission,
    activeSystem,
    dockingTarget,
    onDock,
    cinematic,
    playerData,
    heatLevel,
    notifications,
    atmosphericCondition,
    onAttemptLanding,
    activeTargets = [],
    gameWon = false,
    distToLZ = 0,
    pendingLanding = false,
    onCancelLanding
}) => {
    const [locked, setLocked] = useState(false);
    const cameraRef = useRef<THREE.Camera>(new THREE.PerspectiveCamera()); // Placeholder

    useEffect(() => {
        const handleLockChange = () => setLocked(!!document.pointerLockElement);
        document.addEventListener('pointerlockchange', handleLockChange);
        return () => document.removeEventListener('pointerlockchange', handleLockChange);
    }, []);

    const showAtmosphereUI = atmosphericCondition.inAtmosphere;
    const isSafe = atmosphericCondition.isSafeToLand;

    return (
        <>
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">

                {/* HUD HEADER */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="flex flex-col gap-2">
                        <div className="bg-black/60 backdrop-blur p-3 border-l-2 border-cyan-500">
                            <div className="text-[10px] text-cyan-500 font-mono uppercase">LOCATION</div>
                            <div className="text-xl font-mono text-white">
                                {showAtmosphereUI ? `${atmosphericCondition.planetName} [ATMOSPHERE]` : (activeSystem?.name || "DEEP SPACE")}
                            </div>
                        </div>
                        {showAtmosphereUI && !gameWon && (
                            <div className="bg-black/60 backdrop-blur p-3 border-l-2 border-green-500">
                                <div className="text-[10px] text-green-500 font-mono uppercase">OBJECTIVE</div>
                                <div className="text-lg font-mono text-white">LAND AT THE GREEN BEACON</div>
                                <div className="text-sm font-mono text-green-300">
                                    DIST TO LZ: {Math.round(distToLZ)}u
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {/* WANTED LEVEL */}
                        {(heatLevel > 0 || showAtmosphereUI) && !gameWon && (
                            <div className="bg-black/80 p-2 border-r-4 border-red-500 flex items-center gap-2 animate-pulse">
                                <span className="text-red-500 font-bold uppercase text-sm">THREAT RADAR</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`w-3 h-4 rounded-sm ${i <= (heatLevel / 20) ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* LANDING STATUS - Only show when relevant (Near LZ or low altitude) */}
                        {showAtmosphereUI && !gameWon && (distToLZ < 1500 || status.altitude < 1000) && (
                            <div className={`p-2 border-r-4 ${isSafe ? 'border-green-500 bg-green-900/40' : 'border-yellow-500 bg-black/60'} backdrop-blur-sm min-w-[200px] text-right`}>
                                <div className={`text-[10px] font-mono mb-1 ${isSafe ? 'text-green-500' : 'text-yellow-500'}`}>LANDING STATUS</div>
                                <div className={`text-sm font-black uppercase tracking-tighter ${isSafe ? 'text-green-400' : 'text-white'}`}>
                                    {isSafe ? (
                                        "READY FOR DEPLOYMENT"
                                    ) : (
                                        <>
                                            {activeTargets.length > 0 && <span className="text-red-500 block">HOSTILES ACTIVE</span>}
                                            {heatLevel >= 5 && <span className="text-orange-500 block">THERMAL HEAT HIGH</span>}
                                            {status.altitude >= 800 && <span className="block opacity-80">ALTITUDE TOO HIGH</span>}
                                            {status.speed >= 500 && <span className="block opacity-80">VELOCITY TOO HIGH</span>}
                                            {distToLZ >= 200 && <span className="block opacity-80">NOT IN POSITION</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* RADAR */}
                        <Radar targets={activeTargets} playerHeading={status.heading} playerPos={status.position} />
                    </div>
                </div>

                {/* THREAT INDICATORS (Screen Edges) */}
                {activeTargets.map(t => (
                    <ThreatIndicator key={t.id} target={t} playerPos={status.position} camera={cameraRef.current} />
                ))}


                {/* NOTIFICATIONS */}
                <div className="absolute top-24 right-6 flex flex-col gap-2 w-80">
                    {notifications.map(note => (
                        <div key={note.id} className="bg-black/70 border-l-2 border-yellow-500 p-2 text-sm text-yellow-100 animate-in fade-in slide-in-from-right">
                            {note.message}
                        </div>
                    ))}
                </div>

                {/* DOCKING / LANDING PROMPT */}
                {!showAtmosphereUI && dockingTarget && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                        <div className="bg-black/80 border border-cyan-500 p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">{dockingTarget.name}</h2>
                            <button onClick={onDock} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 uppercase font-bold tracking-widest">
                                {dockingTarget.type === 'PLANET' ? 'Enter Atmosphere' : 'Dock'}
                            </button>
                        </div>
                    </div>
                )}

                {/* LANDING CONFIRMATION POPUP */}
                {pendingLanding && !gameWon && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
                        <div className="bg-black/90 border-2 border-green-500 p-8 text-center max-w-md animate-in zoom-in">
                            <h2 className="text-3xl font-black text-green-400 mb-2 tracking-tighter">LANDING CLEARANCE</h2>
                            <p className="text-white font-mono text-sm mb-6">PROXIMITY ALERT: {atmosphericCondition.landingZones.find(lz => lz.id === atmosphericCondition.activeLandingZoneId)?.name}<br />CONDITION: SAFE</p>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={onAttemptLanding}
                                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 uppercase font-black tracking-widest transition-all hover:scale-105"
                                >
                                    CONFIRM LANDING [L]
                                </button>
                                <button
                                    onClick={onCancelLanding}
                                    className="border border-red-500 text-red-500 px-6 py-3 uppercase font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                    ABORT
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VICTORY SCREEN */}
                {gameWon && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto">
                        <div className="text-center">
                            <h1 className="text-6xl font-black text-green-500 mb-4 tracking-tighter">MISSION ACCOMPLISHED</h1>
                            <div className="text-2xl text-white mb-8 font-mono">LANDING CONFIRMED. WELCOME TO AERION PRIME.</div>
                            <div className="text-xl text-yellow-400 mb-4">REWARD: +10,000 CREDITS</div>
                            <button className="border border-green-500 text-green-500 px-6 py-2 hover:bg-green-500 hover:text-white transition-colors" onClick={() => window.location.reload()}>
                                RESTART SIMULATION
                            </button>
                        </div>
                    </div>
                )}

                {/* DASHBOARD */}
                <div className={`flex justify-between items-end transition-opacity duration-500 ${locked ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="bg-black/60 p-4 rounded-tr-lg border-l-4 border-blue-500 font-mono text-blue-200">
                        <div>SPEED: {status.speed} m/s</div>
                        <div>ALT: {status.altitude} u</div>
                    </div>
                    <div className="bg-black/60 p-4 rounded-tl-lg border-r-4 border-red-500 font-mono text-red-200">
                        <div>CREDITS: {playerData.credits}</div>
                        <div>HULL: 100%</div>
                    </div>
                </div>

            </div>

            {!locked && !dockingTarget && !gameWon && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-default" onClick={requestPointerLock}>
                    <h1 className="text-4xl font-bold text-white tracking-widest mb-4">GEMINI FLIGHT</h1>
                    <div className="text-cyan-400 border border-cyan-500 px-6 py-3 rounded uppercase tracking-widest text-sm animate-pulse cursor-pointer">
                        Click to Engage
                    </div>
                </div>
            )}
        </>
    );
};