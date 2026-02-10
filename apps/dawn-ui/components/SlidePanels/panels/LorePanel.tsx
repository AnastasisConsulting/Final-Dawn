import React, { useMemo } from 'react';
import { useSim } from '../../../src/context/SimContext';
import { useGame } from '../../../src/context/GameContext';
import generatedQuests from '../../../src/data/generated_quests.json';

// Define strict types for NPC data structure
interface NPC {
    name: string;
    id: string;
    role: string;
    location?: string;
}

interface QuestCast {
    giver?: { name: string; id: string; role?: string };
    contact?: { name: string; id: string; role?: string };
    target?: { name: string; id: string; role?: string };
    [key: string]: any; // Allow flexibility
}

interface Quest {
    title: string;
    narrative_guidance: string;
    improvisation_points: string[];
    cast: QuestCast;
}

export const LorePanel: React.FC = () => {
    const { state } = useGame();
    // We use selectedPlanetId (e.g. "G1-S1-O1") as the primary location key
    const { simState, currentRegionName } = useSim();

    // Determine current Quest Line based on Archetype
    const archetype = (state.identity?.core === 'REBEL' ? 'STR' :
        state.identity?.core === 'HACKER' ? 'INT' :
            state.identity?.core === 'ACOLYTE' ? 'DEX' : 'STR') as 'STR' | 'INT' | 'DEX';

    // Current Location Key
    const locationKey = simState.selectedPlanetId || 'G1-S1-O1'; // Default for testing if null

    // Extract Quests and NPCs from the generated data
    const { activeQuests, localNPCs } = useMemo(() => {
        // @ts-ignore - JSON import might be loosely typed
        const locationData = generatedQuests[locationKey];
        if (!locationData) return { activeQuests: [], localNPCs: [] };

        const affinityData = locationData[archetype];
        if (!affinityData || !affinityData.quests) return { activeQuests: [], localNPCs: [] };

        const quests: Quest[] = affinityData.quests;
        const npcs: NPC[] = [];
        const seen = new Set();

        quests.forEach((q) => {
            if (q.cast) {
                Object.entries(q.cast).forEach(([role, char]: [string, any]) => {
                    // Handle both string IDs (old format) and object definitions (new format)
                    if (typeof char === 'string') return; // Skip old string-only format if present

                    if (char && char.id && !seen.has(char.id)) {
                        npcs.push({
                            name: char.name,
                            id: char.id,
                            role: (char.role || role).toUpperCase(),
                            location: locationKey
                        });
                        seen.add(char.id);
                    }
                });
            }
        });

        return { activeQuests: quests, localNPCs: npcs };
    }, [archetype, locationKey]);

    return (
        <div className="h-full w-full flex flex-col p-4 text-cyan-100 font-mono overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="mb-6 border-b border-cyan-500/30 pb-2">
                <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase text-shadow-sm">
                    LORE_DATABASE
                </h2>
                <div className="text-[10px] text-cyan-600 uppercase tracking-[0.2em] flex justify-between">
                    <span>SECTOR: {locationKey}</span>
                    <span>AFFINITY: {archetype}</span>
                </div>
            </div>

            {/* Current Location Info */}
            <section className="mb-8">
                <h3 className="text-sm font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Active Objectives
                </h3>

                {activeQuests.length > 0 ? (
                    <div className="space-y-4">
                        {activeQuests.map((quest, idx) => (
                            <div key={idx} className="bg-purple-950/10 border border-purple-900/30 p-4 rounded text-xs text-purple-100/80 leading-relaxed">
                                <h4 className="text-purple-300 font-bold mb-2 uppercase">{quest.title}</h4>
                                <p className="mb-3 italic opacity-80">"{quest.narrative_guidance}"</p>
                                <ul className="list-disc pl-4 space-y-1 text-[10px] text-purple-200/70">
                                    {quest.improvisation_points.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-purple-950/10 border border-purple-900/30 p-4 rounded text-xs text-gray-500 italic">
                        No active frequencies detected in this sector.
                    </div>
                )}
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
