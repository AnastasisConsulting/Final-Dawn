import React, { useMemo } from 'react';
import { useSim } from '../../../src/context/SimContext';
import { useGame } from '../../../src/context/GameContext';
import questsData from '../../../src/data/quests.json';

// Define strict types for NPC data structure
interface NPC {
    name: string;
    id: string;
    role: string;
    location?: string;
}

export const LorePanel: React.FC = () => {
    const { state } = useGame();
    const { simState, currentRegionName } = useSim();

    // Determine current Quest Line based on Archetype
    const archetype = (state.identity?.core === 'REBEL' ? 'STR' :
        state.identity?.core === 'HACKER' ? 'INT' :
            state.identity?.core === 'ACOLYTE' ? 'DEX' : 'STR') as 'STR' | 'INT' | 'DEX';

    // Extract NPCs from the quest data for the current archetype
    const localNPCs = useMemo(() => {
        // @ts-ignore
        const pathData = questsData.paths[archetype];
        if (!pathData) return [];

        const npcs: NPC[] = [];
        const seen = new Set();

        pathData.campaign_outline.quests.forEach((q: any) => {
            if (q.cast) {
                Object.entries(q.cast).forEach(([role, char]: [string, any]) => {
                    if (!seen.has(char.id)) {
                        npcs.push({
                            name: char.name,
                            id: char.id,
                            role: role.toUpperCase(),
                            location: 'Unknown Sector' // Placeholder until map data integration
                        });
                        seen.add(char.id);
                    }
                });
            }
        });
        return npcs;
    }, [archetype]);

    return (
        <div className="h-full w-full flex flex-col p-4 text-cyan-100 font-mono overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="mb-6 border-b border-cyan-500/30 pb-2">
                <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase text-shadow-sm">
                    LORE_DATABASE
                </h2>
                <div className="text-[10px] text-cyan-600 uppercase tracking-[0.2em] flex justify-between">
                    <span>Region: {currentRegionName}</span>
                    <span>System: {simState.selectedSystemId || 'Deep Space'}</span>
                </div>
            </div>

            {/* Current Location Info */}
            <section className="mb-8">
                <h3 className="text-sm font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Local Intelligence
                </h3>
                <div className="bg-purple-950/10 border border-purple-900/30 p-4 rounded text-xs text-purple-100/80 leading-relaxed">
                    <p className="mb-2">
                        Analyzing local societal structures... The current region appears to be heavily influenced by
                        <span className="text-purple-300 font-bold"> {archetype} </span>
                        aligned factions.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button className="bg-purple-900/40 border border-purple-500/30 p-2 rounded hover:bg-purple-800/50 transition-colors text-[10px] uppercase tracking-wider text-purple-300">
                            Scan Flora/Fauna
                        </button>
                        <button className="bg-purple-900/40 border border-purple-500/30 p-2 rounded hover:bg-purple-800/50 transition-colors text-[10px] uppercase tracking-wider text-purple-300">
                            History Logs
                        </button>
                    </div>
                </div>
            </section>

            {/* NPC List */}
            <section>
                <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3 border-l-2 border-cyan-600 pl-2">
                    Known Contacts
                </h3>
                <div className="grid gap-3">
                    {localNPCs.map((npc) => (
                        <div key={npc.id} className="bg-cyan-950/20 border border-cyan-900/30 p-3 rounded hover:bg-cyan-900/40 transition-colors group relative overflow-hidden">
                            {/* Decorative visual element */}
                            <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-cyan-900/10 to-transparent pointer-events-none" />

                            <div className="flex justify-between items-start z-10 relative">
                                <div>
                                    <div className="text-cyan-200 font-bold text-sm tracking-wide group-hover:text-cyan-100 mb-1">{npc.name}</div>
                                    <div className="text-[10px] text-cyan-500 font-bold">{npc.role}</div>
                                </div>
                                <div className="text-[9px] text-cyan-700 font-mono bg-black/30 px-1 rounded">
                                    ID: {npc.id.split('-').pop()}
                                </div>
                            </div>

                            <div className="mt-3 flex justify-end gap-2">
                                <button className="px-2 py-1 text-[9px] border border-cyan-700/50 text-cyan-500 hover:text-cyan-300 hover:border-cyan-400 rounded transition-colors uppercase">
                                    Hail
                                </button>
                                <button className="px-2 py-1 text-[9px] border border-cyan-700/50 text-cyan-500 hover:text-cyan-300 hover:border-cyan-400 rounded transition-colors uppercase">
                                    Locate
                                </button>
                            </div>
                        </div>
                    ))}
                    {localNPCs.length === 0 && (
                        <div className="text-xs text-gray-500 italic p-4 text-center">
                            No contacts found in current sector.
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
};
