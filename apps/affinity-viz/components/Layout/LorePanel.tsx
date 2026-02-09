import React from 'react';

interface LoreData {
    description?: string;
    summary?: string;
    governor?: string | { name: string; role?: string; title?: string };
    leader?: string | { name: string; role?: string; title?: string };
    inhabitants?: string | { name: string; title?: string; role?: string }[];
    culture_notes?: string;
    coordinates?: { x: number; y: number };
    [key: string]: any;
}

interface LorePanelProps {
    data: LoreData;
    title: string;
    type: string;
    onFastTravel?: () => void;
    onBack?: () => void;
    onOpenMemoryViz?: () => void;
}

export const LorePanel: React.FC<LorePanelProps> = ({ data, title, type, onFastTravel, onBack, onOpenMemoryViz }) => {


    const getLeaderName = (person: string | { name: string } | undefined) => {
        if (!person) return null;
        return typeof person === 'string' ? person : person.name;
    };

    if (!data) {
        return (
            <div className="relative h-full w-1/3 bg-neutral-950/90 border-r border-cyan-900/30 flex flex-col backdrop-blur-sm">
                {onBack && (
                    <div className="p-4 border-b border-cyan-900/30">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-xs font-bold text-cyan-500 hover:text-cyan-300 transition-colors uppercase tracking-widest"
                        >
                            <span>&lt; RETURN</span>
                        </button>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-cyan-800/50 text-sm font-mono">
                        NO DATA STREAM
                    </div>
                </div>
                {/* Fast Travel Button - always show when available */}
                {onFastTravel && (
                    <div className="p-4 border-t border-cyan-900/30">
                        <button
                            onClick={onFastTravel}
                            className="w-full py-3 bg-cyan-900/30 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-800/40 transition-all text-cyan-300 font-mono text-sm uppercase tracking-widest animate-pulse"
                        >
                            ⚡ FAST TRAVEL
                        </button>
                    </div>
                )}
            </div>
        );
    }


    return (
        <div className="w-1/3 h-full bg-neutral-950/90 border-r border-cyan-900/30 flex flex-col text-cyan-100/90 font-mono backdrop-blur-sm overflow-hidden">

            {/* Sticky Header */}
            <div className="flex-none p-4 pb-0">
                {onBack && (
                    <div className="mb-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-xs font-bold text-cyan-500 hover:text-cyan-300 transition-colors uppercase tracking-widest border border-cyan-900/50 bg-cyan-950/30 px-3 py-2 rounded hover:bg-cyan-900/50"
                        >
                            <span>&lt; RETURN TO ORBIT</span>
                        </button>
                    </div>
                )}
                <div className="mb-2 border-b border-cyan-500/30 pb-4">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-400 mb-1">
                        {type} DIRECTORY
                    </div>
                    <h2 className="text-3xl font-bold uppercase text-white tracking-wide text-shadow-sm">
                        {title}
                    </h2>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar space-y-6">
                {/* Description Section */}
                {data.description && (
                    <section>
                        <h3 className="text-sm font-bold text-cyan-300 uppercase mb-2 border-l-2 border-cyan-500 pl-2">
                            Overview
                        </h3>
                        <p className="text-sm leading-relaxed text-cyan-100/80">
                            {data.description}
                        </p>
                    </section>
                )}

                {/* Governance / Leadership */}
                {(data.governor || data.leader) && (
                    <section className="bg-cyan-900/10 p-3 rounded border border-cyan-500/10">
                        <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">
                            Leadership
                        </h3>
                        {data.governor && (
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-cyan-500/70">GOVERNOR:</span>
                                <span>{getLeaderName(data.governor)}</span>
                            </div>
                        )}
                        {data.leader && (
                            <div className="flex justify-between text-sm">
                                <span className="text-cyan-500/70">LEADER:</span>
                                <span>{getLeaderName(data.leader)}</span>
                            </div>
                        )}
                    </section>
                )}

                {/* Demographics / Inhabitants */}
                {data.inhabitants && (
                    <section>
                        <h3 className="text-sm font-bold text-cyan-300 uppercase mb-2 border-l-2 border-cyan-500 pl-2">
                            Demographics
                        </h3>
                        {Array.isArray(data.inhabitants) ? (
                            <div className="space-y-2">
                                {data.inhabitants.map((npc, idx) => (
                                    <div key={idx} className="flex justify-between text-sm border-b border-cyan-900/30 pb-1">
                                        <span className="text-cyan-100">{npc.name}</span>
                                        <span className="text-cyan-500/70 text-xs">{npc.title || npc.role}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm leading-relaxed text-cyan-100/80">
                                {data.inhabitants}
                            </p>
                        )}
                    </section>
                )}

                {/* Culture */}
                {data.culture_notes && (
                    <section>
                        <h3 className="text-sm font-bold text-cyan-300 uppercase mb-2 border-l-2 border-cyan-500 pl-2">
                            Cultural Analysis
                        </h3>
                        <p className="text-sm leading-relaxed text-cyan-100/80 italic border border-cyan-500/10 p-2 bg-black/20">
                            "{data.culture_notes}"
                        </p>
                    </section>
                )}

                {/* Summary Fallback */}
                {data.summary && !data.description && (
                    <section>
                        <h3 className="text-sm font-bold text-cyan-300 uppercase mb-2 border-l-2 border-cyan-500 pl-2">
                            Summary
                        </h3>
                        <p className="text-sm leading-relaxed text-cyan-100/80">
                            {data.summary}
                        </p>
                    </section>
                )}
            </div>

            {/* Sticky Footer */}
            <div className="flex-none p-4 border-t border-cyan-900/30 space-y-3 bg-neutral-950/50 backdrop-blur-md">
                {/* Coordinates Display */}
                {data.coordinates && (
                    <div className="text-[10px] text-cyan-600/70 text-center font-mono">
                        COORDS: [{data.coordinates.x}, {data.coordinates.y}]
                    </div>
                )}

                {/* Memory Viz Link */}
                {onOpenMemoryViz && (
                    <button
                        onClick={onOpenMemoryViz}
                        className="w-full py-2 bg-purple-900/30 border border-purple-500/50 hover:bg-purple-800/40 hover:border-purple-400 text-purple-300 font-mono text-xs uppercase tracking-wider transition-all mb-2"
                    >
                        ✣ {title} MEMORY
                    </button>
                )}

                {/* Fast Travel Button */}
                {onFastTravel && (
                    <button
                        onClick={onFastTravel}
                        className="w-full py-3 bg-cyan-900/30 border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-800/40 transition-all text-cyan-300 font-mono text-sm uppercase tracking-widest animate-pulse"
                    >
                        ⚡ FAST TRAVEL
                    </button>
                )}

                {/* Archive Footer */}
                <div className="text-[10px] text-cyan-600/50 text-center">
                    CONFIDENTIAL // ARCHIVE ACCESS LOGGED
                </div>
            </div>
        </div>
    );
};
