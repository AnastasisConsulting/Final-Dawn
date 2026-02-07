
import React, { useEffect, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { FlightStatus, MissionState, SystemNode, Target, CinematicState, NavBotState, PlayerData, NotificationItem } from '../types';
import { requestPointerLock } from './Controls';

// A sub-component to handle the 3D-to-2D projection within the Canvas context
// We can't put this directly in Interface because Interface is outside the Canvas in App.tsx
// However, Interface.tsx is currently outside Canvas. 
// We will create a helper calculation function here that App.tsx can use, 
// OR we move the HUD logic into a new component.
// For minimal file changes, we will improve the CSS-based Minimap to be a "Tactical Overlay" 
// but it needs camera access. 
// Since Interface is outside Canvas, we can't easily get camera matrix. 
// STRATEGY: We will add a new component "TacticalHUD" that lives INSIDE the canvas in App.tsx 
// but renders HTML overlays via @react-three/drei/Html.

// Update Interface to remove the old radar and focus on UI shell.
// The actual tracking will move to CombatSystem or a new overlay.

interface InterfaceProps {
    status: FlightStatus;
    mission: MissionState;
    onRequestMission: () => void;
    loading: boolean;
    onUploadTexture: (url: string) => void;
    universeLayout: SystemNode[];
    navTarget: SystemNode | null;
    onSetNavTarget: (node: SystemNode | null) => void;
    autopilot: boolean;
    onToggleAutopilot: () => void;
    activeSystem: SystemNode | null;
    dockingTarget: SystemNode | null;
    onDock: () => void;
    hasSuccessfulLanding: boolean;
    onAutoLand: () => void;
    isAutoLanding: boolean;
    activeTargets: Target[];
    cinematic?: CinematicState;
    navBot: NavBotState;
    playerData: PlayerData;
    heatLevel: number;
    onSpendCredits: (item: string, cost: number) => void;
    notifications: NotificationItem[];
}

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        let i = 0;
        setDisplayed('');
        const interval = setInterval(() => {
            setDisplayed(text.substring(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [text]);
    return <span>{displayed}</span>;
}

export const Interface: React.FC<InterfaceProps> = ({
    status,
    mission,
    autopilot,
    activeSystem,
    dockingTarget,
    onDock,
    hasSuccessfulLanding,
    onAutoLand,
    isAutoLanding,
    cinematic,
    navBot,
    playerData,
    heatLevel,
    onSpendCredits,
    notifications
}) => {
    const [locked, setLocked] = useState(false);

    useEffect(() => {
        const handleLockChange = () => setLocked(!!document.pointerLockElement);
        document.addEventListener('pointerlockchange', handleLockChange);
        return () => document.removeEventListener('pointerlockchange', handleLockChange);
    }, []);

    const isAmbush = cinematic?.type === 'AMBUSH' || cinematic?.type === 'BOSS_INTRO';

    return (
        <>
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">

                {/* TOP LEFT - NAV & INFO */}
                <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md p-3 border-l-2 border-cyan-500 rounded-r-lg">
                        <div className="text-[10px] text-cyan-500 font-mono uppercase">COORDINATES</div>
                        <div className="text-xl font-mono text-white tracking-widest">
                            {status.position[0].toFixed(0)} <span className="text-gray-600">|</span> {status.position[2].toFixed(0)}
                        </div>
                    </div>

                    {/* NAVBOT */}
                    {navBot.active && (
                        <div className="w-[220px] bg-cyan-900/40 border-l-2 border-cyan-400 p-3 backdrop-blur-md mt-2 transition-opacity duration-500 animate-in slide-in-from-left" style={{ opacity: navBot.opacity }}>
                            <div className="flex items-center gap-2 mb-1 border-b border-cyan-500/30 pb-1">
                                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                                <div className="text-[10px] text-cyan-300 font-bold tracking-widest">NAV-AI</div>
                            </div>
                            <div className="text-sm text-cyan-100 font-mono italic leading-tight">"{navBot.message}"</div>
                        </div>
                    )}
                </div>

                {/* TOP RIGHT - QUESTS & PROGRESSION & NOTIFICATIONS */}
                <div className="absolute top-4 right-4 pointer-events-auto flex flex-col items-end gap-2">

                    {/* NOTIFICATION STACK */}
                    <div className="flex flex-col gap-2 items-end mb-4 w-80">
                        {notifications.map(note => (
                            <div key={note.id} className="animate-in slide-in-from-right fade-in duration-300 w-full">
                                <div className={`bg-black/80 backdrop-blur border-l-4 p-3 shadow-lg 
                             ${note.type === 'LOOT' ? 'border-yellow-500' :
                                        note.type === 'ACHIEVEMENT' ? 'border-purple-500' :
                                            note.type === 'WARNING' ? 'border-red-500' : 'border-cyan-500'}`
                                }>
                                    <div className={`text-xs font-bold uppercase tracking-wider 
                                 ${note.type === 'LOOT' ? 'text-yellow-400' :
                                            note.type === 'ACHIEVEMENT' ? 'text-purple-400' :
                                                note.type === 'WARNING' ? 'text-red-400' : 'text-cyan-400'}`
                                    }>
                                        {note.message}
                                    </div>
                                    {note.subtext && <div className="text-white text-sm font-mono">{note.subtext}</div>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* QUEST BOX */}
                    <div className={`transition-opacity duration-500 ${locked ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="bg-black/80 backdrop-blur-md border border-amber-500/30 p-4 rounded-lg text-amber-400 font-mono w-80 shadow-lg">
                            <h2 className="text-xs uppercase tracking-widest mb-2 border-b border-amber-500/30 pb-1 flex justify-between">
                                <span>Active Contract</span>
                                <span className="text-amber-600">ID: {mission.activeQuest?.id.substr(0, 4) || '---'}</span>
                            </h2>

                            {mission.activeQuest ? (
                                <>
                                    <div className="text-sm font-bold text-white mb-2">{mission.activeQuest.description}</div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
                                        <div
                                            className={`h-full ${mission.activeQuest.completed ? 'bg-green-500' : 'bg-amber-500'} transition-all duration-500`}
                                            style={{ width: `${(mission.activeQuest.currentCount / mission.activeQuest.targetCount) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>PROGRESS: {mission.activeQuest.currentCount}/{mission.activeQuest.targetCount}</span>
                                        <span className="text-green-400 font-bold">REWARD: {mission.activeQuest.rewardCredits} CR</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-500 italic">Searching for available contracts...</div>
                            )}
                        </div>

                        {/* HEAT GAUGE */}
                        <div className="mt-2 bg-black/60 backdrop-blur p-2 rounded border border-red-900 w-80 flex items-center gap-2">
                            <span className="text-[10px] text-red-500 font-bold">THREAT LEVEL</span>
                            <div className="flex-grow h-1 bg-gray-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-600 transition-all duration-300"
                                    style={{ width: `${Math.min(100, (heatLevel / 10) * 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-[10px] text-red-400">{heatLevel.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* BOTTOM LEFT - SHIP SYSTEMS (SHOP) */}
                <div className={`absolute bottom-6 left-6 pointer-events-auto transition-opacity duration-500 ${locked ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="bg-black/80 backdrop-blur-md border-t-2 border-cyan-500 p-4 rounded-tr-3xl min-w-[300px]">
                        <div className="flex justify-between items-baseline mb-3 border-b border-gray-700 pb-1">
                            <span className="text-cyan-400 font-mono text-xs tracking-[0.2em]">SYSTEMS & UPGRADES</span>
                            <span className="text-yellow-400 font-bold font-mono text-sm">{playerData.credits} CR</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => onSpendCredits('REPAIR', 200)}
                                className="bg-gray-800 hover:bg-green-900/50 border border-gray-600 hover:border-green-500 p-2 rounded text-left transition-colors group"
                                disabled={playerData.credits < 200}
                            >
                                <div className="text-[10px] text-gray-400 group-hover:text-green-300">HULL REPAIR</div>
                                <div className="text-white font-bold text-xs">200 CR</div>
                            </button>
                            <button
                                onClick={() => onSpendCredits('SHIELD', 300)}
                                className="bg-gray-800 hover:bg-blue-900/50 border border-gray-600 hover:border-blue-500 p-2 rounded text-left transition-colors group"
                                disabled={playerData.credits < 300}
                            >
                                <div className="text-[10px] text-gray-400 group-hover:text-blue-300">SHIELD CELL</div>
                                <div className="text-white font-bold text-xs">300 CR</div>
                            </button>
                            <button
                                onClick={() => onSpendCredits('WEAPON', 2000 * (playerData.weaponLevel + 1))}
                                className="col-span-2 bg-gray-800 hover:bg-red-900/50 border border-gray-600 hover:border-red-500 p-2 rounded text-left transition-colors group"
                                disabled={playerData.credits < (2000 * (playerData.weaponLevel + 1)) || playerData.weaponLevel >= 3}
                            >
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-gray-400 group-hover:text-red-300">WEAPON OUTPUT LVL {playerData.weaponLevel + 1}</span>
                                    {playerData.weaponLevel >= 3 ? <span className="text-red-500 text-[10px]">MAX</span> : null}
                                </div>
                                <div className="text-white font-bold text-xs">
                                    {playerData.weaponLevel >= 3 ? "---" : `${2000 * (playerData.weaponLevel + 1)} CR`}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center Reticle */}
                {locked && !cinematic?.active && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className={`w-12 h-12 border rounded-full flex items-center justify-center transition-colors duration-300 ${status.flightAssist ? 'border-cyan-500/50' : 'border-orange-500/50'}`}>
                            <div className={`w-1 h-1 rounded-full ${status.flightAssist ? 'bg-cyan-500' : 'bg-orange-500'}`}></div>
                        </div>
                    </div>
                )}

                {/* CINEMATIC OVERLAY */}
                {cinematic?.active && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-black animate-in slide-in-from-top duration-500"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-black animate-in slide-in-from-bottom duration-500"></div>
                        <div className={`bg-black/80 border-y-2 ${isAmbush ? 'border-red-600' : 'border-amber-500'} w-full max-w-3xl p-8 backdrop-blur-md relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none"></div>
                            <div className={`flex items-center gap-4 mb-4 border-b ${isAmbush ? 'border-red-800' : 'border-amber-800/50'} pb-2`}>
                                <div className={`w-3 h-3 rounded-full ${isAmbush ? 'bg-red-500' : 'bg-amber-500'} animate-pulse`}></div>
                                <h1 className={`text-2xl font-bold tracking-[0.3em] font-mono ${isAmbush ? 'text-red-500' : 'text-amber-500'}`}>
                                    {cinematic.message || "INCOMING TRANSMISSION"}
                                </h1>
                            </div>
                            <div className={`font-mono text-lg leading-relaxed ${isAmbush ? 'text-red-100' : 'text-amber-100'}`}>
                                {cinematic.transmission ? <TypewriterText text={`"${cinematic.transmission}"`} /> : "Decoding signal..."}
                            </div>
                        </div>
                    </div>
                )}

                {/* DOCKING INTERFACE */}
                {activeSystem && dockingTarget && !isAutoLanding && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50">
                        {/* Visual Lines */}
                        <div className="absolute top-0 left-1/2 w-[1px] h-32 bg-cyan-500/50 -translate-y-full"></div>
                        <div className="absolute bottom-0 left-1/2 w-[1px] h-32 bg-cyan-500/50 translate-y-full"></div>
                        <div className="absolute left-0 top-1/2 w-32 h-[1px] bg-cyan-500/50 -translate-x-full"></div>
                        <div className="absolute right-0 top-1/2 w-32 h-[1px] bg-cyan-500/50 translate-x-full"></div>

                        <div className="bg-black/80 backdrop-blur-md border border-cyan-400 p-6 rounded-lg text-center shadow-[0_0_30px_rgba(34,211,238,0.3)] animate-in fade-in zoom-in duration-300">
                            <div className="text-cyan-500 text-[10px] uppercase tracking-[0.3em] mb-1">PROXIMITY ALERT</div>
                            <h1 className="text-3xl font-bold text-white uppercase tracking-widest mb-1">{dockingTarget.name}</h1>
                            <div className="flex flex-col gap-3 mt-4">
                                <button onClick={onDock} className="w-full bg-cyan-500 text-black font-bold py-3 px-6 rounded uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                                    {dockingTarget.type === 'PLANET' || dockingTarget.type === 'MOON' ? 'INITIATE ATMOSPHERIC ENTRY [F]' : 'INITIATE DOCKING SEQUENCE [F]'}
                                </button>
                                {hasSuccessfulLanding && (
                                    <button onClick={onAutoLand} className="w-full bg-indigo-600/20 border border-indigo-500 text-indigo-300 font-bold py-2 px-6 rounded uppercase tracking-widest hover:bg-indigo-600/40 transition-all text-xs flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                        ENGAGE AUTO-PILOT
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Dashboard */}
                <div className={`flex justify-between items-end w-full mt-auto transition-opacity duration-500 ${locked ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="bg-black/50 backdrop-blur-sm p-4 rounded-tr-3xl border-l-4 border-cyan-500 font-mono ml-[320px]"> {/* Offset for Shop */}
                        <div className="mb-2">
                            <span className="text-xs text-gray-400 block">THRUST</span>
                            <div className="w-32 h-2 bg-gray-800 rounded overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all duration-75" style={{ width: `${Math.min(status.speed / 100 * 100, 100)}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block">SPEED</span>
                            <span className="text-3xl text-white">{status.speed} <span className="text-sm text-gray-500">m/s</span></span>
                        </div>
                    </div>

                    <div className="bg-black/50 backdrop-blur-sm p-4 rounded-tl-3xl border-r-4 border-cyan-500 font-mono text-right">
                        <div>
                            <span className="text-xs text-gray-400 block">ALT</span>
                            <span className="text-3xl text-white">{status.altitude} <span className="text-sm text-gray-500">u</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {!locked && !dockingTarget && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-default">
                    <div className="text-center mb-8 pointer-events-auto cursor-pointer" onClick={requestPointerLock}>
                        <h1 className="text-4xl font-bold text-white tracking-widest mb-4">GEMINI FLIGHT ONE</h1>
                        <div className="text-cyan-400 border border-cyan-500 px-6 py-3 rounded uppercase tracking-widest text-sm bg-cyan-500/10 hover:bg-cyan-500/30 transition-all animate-pulse">
                            Click to Engage Flight Systems
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
