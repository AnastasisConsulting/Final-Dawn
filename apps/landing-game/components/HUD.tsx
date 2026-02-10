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
    };
}

export const HUD: React.FC<HUDProps> = ({ data }) => {
    return (
        <div className="absolute inset-0 pointer-events-none text-cyan-400 font-mono tracking-widest text-shadow-glow">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="border border-cyan-500/50 bg-black/40 p-2 backdrop-blur-sm">
                    <div className="text-xs text-cyan-600">SCORE</div>
                    <div className="text-2xl font-bold">{data.score.toString().padStart(6, '0')}</div>
                </div>

                {/* Landing Guidance */}
                <div className="flex flex-col items-center">
                    <div className="border border-yellow-500/50 bg-yellow-900/20 px-4 py-1 backdrop-blur-sm mb-2">
                        <span className="text-xs text-yellow-400 animate-pulse">LZ DISTANCE: {data.distanceToTarget}m</span>
                    </div>
                </div>

                <div className="border border-red-500/50 bg-black/40 p-2 backdrop-blur-sm min-w-[200px]">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-red-400">HULL INTEGRITY</span>
                        <span className="text-xs">{Math.round(data.health)}%</span>
                    </div>
                    <div className="h-2 w-full bg-red-900/30">
                        <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{ width: `${data.health}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className={`w-8 h-8 border border-cyan-400/80 rounded-full flex items-center justify-center transition-colors ${data.targetLocked ? 'border-red-500 shadow-[0_0_10px_red]' : ''}`}>
                    <div className="w-1 h-1 bg-cyan-200 rounded-full" />
                </div>
                {data.targetLocked && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 text-red-500 text-xs animate-pulse font-bold">
                        LOCK
                    </div>
                )}
            </div>

            {/* Flight Data */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                <div className="flex gap-4 items-end">
                    <div className="text-right">
                        <div className="text-4xl font-bold">{data.speed}</div>
                        <div className="text-xs text-cyan-600">KPH</div>
                    </div>
                    <div className="h-12 w-[1px] bg-cyan-500/50" />
                    <div>
                        <div className="text-xl">{data.altitude}</div>
                        <div className="text-xs text-cyan-600">ALT</div>
                    </div>
                </div>
                <div className="text-xs mt-2 text-cyan-600/80">
                    <div>F-ASSIST: <span className={data.flightAssist ? "text-green-400" : "text-orange-400"}>{data.flightAssist ? "ON" : "OFF"}</span></div>
                    <div>WEAPON LVL: {data.weaponLevel}</div>
                    {data.landingState !== 'FLYING' && (
                        <div className="text-yellow-400 animate-pulse font-bold mt-1 tracking-tighter">
                            LANDING SEQUENCE ACTIVE
                        </div>
                    )}
                    {data.landingGear && data.landingGear > 0.1 && (
                        <div className="text-green-400 font-bold">
                            GEAR: {Math.round(data.landingGear * 100)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Compass Tape */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 overflow-hidden mask-linear">
                <div className="flex gap-4 justify-center text-xs opacity-70" style={{ transform: `translateX(${-data.heading}px)` }}>
                    {Array.from({ length: 36 }).map((_, i) => (
                        <span key={i} className="min-w-[40px] text-center">{(i * 10)}</span>
                    ))}
                </div>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-cyan-400 mx-auto mt-1" />
            </div>

            <style>{`
                .text-shadow-glow { text-shadow: 0 0 5px rgba(34, 211, 238, 0.5); }
            `}</style>
        </div>
    );
};