import React from 'react';

interface HUDProps {
    data: {
        score: number;
        health: number;
        wave: number;
        speed: number;
        altitude: number;
        heading: number;
        targetLocked: boolean;
        flightAssist: boolean;
        weaponLevel: number;
        distanceToTarget: number;
        landingGear?: number;
        landingState?: 'FLYING' | 'LANDING' | 'DOCKED';
        isReentering?: boolean;
        isEvading?: boolean;
    };
}

export const HUD: React.FC<HUDProps> = ({ data }) => {
    return (
        <div className="absolute inset-0 pointer-events-none text-cyan-400 font-mono tracking-widest text-shadow-glow">
            {/* 1. RE-ENTRY HEAT OVERLAY */}
            {data.isReentering && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-600/10 via-transparent to-orange-600/10 animate-pulse border-[20px] border-orange-500/10" />
            )}

            {/* Top Bar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <div className="border-l-4 border-cyan-500 bg-black/60 p-3 backdrop-blur-md">
                        <div className="text-[10px] text-cyan-600/80 mb-1">DATA_STREAM / SCORE</div>
                        <div className="text-3xl font-black italic">{data.score.toString().padStart(7, '0')}</div>
                    </div>

                    {/* GTA STYLE WANTED LEVEL */}
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className={`text-2xl transition-all duration-300 ${data.isEvading ? 'text-yellow-500 animate-pulse' : 'text-slate-800'}`}
                            >
                                ★
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Guidance */}
                <div className="flex flex-col items-center gap-2">
                    <div className="border border-yellow-500/50 bg-black/60 px-6 py-2 backdrop-blur-md">
                        <div className="text-[10px] text-yellow-500/70 text-center mb-1 font-bold">LZ_VECTOR / TARGET</div>
                        <div className="text-xl font-bold flex items-center gap-3">
                            <span className="w-2 h-2 bg-yellow-500 animate-ping rounded-full" />
                            {data.distanceToTarget}m
                        </div>
                    </div>
                    {data.isEvading && (
                        <div className="text-white font-black text-xs animate-pulse px-4 py-1 bg-red-600 border border-white uppercase flex items-center gap-2">
                            <span className="animate-ping">●</span>
                            LANDING_LOCK: EVADE_THREAT
                        </div>
                    )}
                    {data.isReentering && !data.isEvading && (
                        <div className="text-red-500 font-black text-sm animate-bounce px-4 py-1 bg-red-900/30 border border-red-500">
                            WARNING: THERMAL LOAD HIGH
                        </div>
                    )}
                </div>

                {/* Health & Fuel */}
                <div className="min-w-[250px] border-r-4 border-red-500 bg-black/60 p-3 backdrop-blur-md">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-red-400/80 font-bold uppercase">Hull Integrity</span>
                            <span className="text-2xl font-black italic">{Math.round(data.health)}%</span>
                        </div>
                        <div className="text-[10px] text-red-400/50 uppercase">Combat_Status</div>
                    </div>
                    <div className="h-2 w-full bg-red-900/30 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${data.isEvading ? 'bg-orange-500 animate-pulse' : data.health < 30 ? 'bg-red-500' : 'bg-red-400'}`}
                            style={{ width: `${data.health}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Crosshair (Improved Center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150">
                <div className={`w-12 h-12 border-2 ${data.targetLocked ? 'border-red-500 rotate-45 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-cyan-400/40'} rounded-none flex items-center justify-center transition-all duration-150`}>
                    <div className={`w-2 h-2 ${data.targetLocked ? 'bg-red-500' : 'bg-cyan-200'} rounded-full`} />
                </div>
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-cyan-400" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-cyan-400" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-400" />
            </div>

            {/* Flight Data Left (Speed/Alt) */}
            <div className="absolute bottom-10 left-10 flex flex-col gap-6">
                <div className="flex gap-6 items-end">
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-cyan-600 font-bold">VELOCITY</div>
                        <div className="text-5xl font-black italic">{data.speed}</div>
                        <div className="h-1 bg-cyan-900/50 w-full overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, data.speed / 5)}%` }} />
                        </div>
                    </div>
                    <div className="w-[1px] h-12 bg-cyan-500/30" />
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-cyan-600 font-bold">ALT / SURFACE</div>
                        <div className="text-3xl font-bold">{data.altitude}</div>
                        <div className="text-[10px] text-cyan-600/50">MEASURED_FROM_PLANET_CORE</div>
                    </div>
                </div>

                <div className="flex gap-4 text-[10px] font-bold">
                    <div className={`px-2 py-1 border ${data.flightAssist ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-orange-900/20 border-orange-500 text-orange-400'}`}>
                        F-ASSIST: {data.flightAssist ? "ACTIVE" : "OFFLIN"}
                    </div>
                    <div className="px-2 py-1 border border-cyan-500 bg-cyan-900/20">
                        WEP_CAP: {data.weaponLevel}
                    </div>
                    {data.landingGear && data.landingGear > 0.1 && (
                        <div className="px-2 py-1 border border-green-500 bg-green-900/20 text-green-400 animate-pulse">
                            EXT_GEAR: {Math.round(data.landingGear * 100)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side Status */}
            <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2">
                <div className={`text-right px-4 py-2 bg-black/60 border-r-4 ${data.landingState === 'FLYING' ? 'border-cyan-500' : 'border-yellow-500'}`}>
                    <div className="text-[10px] opacity-70">PHASE_STATUS</div>
                    <div className="text-xl font-black italic uppercase">
                        {data.landingState === 'DOCKED' ? 'MISSION COMPLETE' : data.landingState === 'LANDING' ? 'AUTO_DESCENT' : 'ORBITAL DROP'}
                    </div>
                </div>
                {data.landingState === 'DOCKED' && (
                    <div className="text-cyan-400 text-sm font-bold animate-pulse">
                        INITIATING DATA UPLOAD...
                    </div>
                )}
            </div>

            <style>{`
                .text-shadow-glow { text-shadow: 0 0 10px rgba(34, 211, 238, 0.4); }
                @keyframes pulse-fast { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
            `}</style>
        </div>
    );
};