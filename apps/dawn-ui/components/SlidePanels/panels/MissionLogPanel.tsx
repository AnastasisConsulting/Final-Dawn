import React, { useMemo } from 'react';
import { useGame } from '../../../src/context/GameContext';
import { useSim } from '../../../src/context/SimContext';
import { useWorldData } from '../../../src/hooks/useWorldData';

export const MissionLogPanel: React.FC = () => {
  const { state } = useGame();
  const { simState } = useSim();
  const { data: worldData, loading, error } = useWorldData(simState.selectedPlanetId || 'G1-S1-O1');

  // Determine player archetype (defaults to STR if unknown)
  // Logic: Check identity.core or default to 'STR'
  const archetype = (state.identity?.core === 'REBEL' ? 'STR' :
    state.identity?.core === 'HACKER' ? 'INT' :
      state.identity?.core === 'ACOLYTE' ? 'DEX' : 'STR') as 'STR' | 'INT' | 'DEX';

  const { mainQuests, sideQuests } = useMemo(() => {
    if (!worldData?.quest_bindings) return { mainQuests: [], sideQuests: [] };

    // Filter quests by archetype if applicable, or just map all for now
    // The current quests.json structure clusters by archetype in the 'paths' object
    // But eideus-world-bundle-binder flattens them into quest_bindings
    // We need to look at the source structure again or adapt the binder.
    // For now, let's display what the binder gives us.

    // Check if we can access the raw quests from the binder output? 
    // The binder output allows access to quest_bindings which has tags.
    // We might need to map tags to archetype if the tags exist.

    // Fallback: The user wants "Main Quests". 
    // Let's map the bound quests to the UI format.

    const displayQuests = worldData.quest_bindings.map((qb, i) => ({
      id: qb.questId,
      title: qb.title || 'Unknown Quest',
      status: i === 0 ? 'ACTIVE' : 'LOCKED',
      description: `Quest involving ${qb.npcIds.join(', ')}`, // Placeholder description as binder doesn't retain full narrative text by default unless we adjust it or read raw
      location: 'Local Sector', // Could derive from spatialTargets
      type: 'MAIN'
    }));

    return { mainQuests: displayQuests, sideQuests: [] };
  }, [worldData, archetype]);

  const displayMain = mainQuests;
  const displaySide = sideQuests;

  if (loading) return <div className="p-4 text-cyan-500">Initializing Mission Link...</div>;
  if (error) return <div className="p-4 text-red-500">Link Failure: {error}</div>;

  return (
    <div className="h-full w-full flex flex-col p-4 text-cyan-100 font-mono overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="mb-6 border-b border-cyan-500/30 pb-2">
        <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase text-shadow-sm">
          MISSION_LOG
        </h2>
        <div className="text-[10px] text-cyan-600 uppercase tracking-[0.2em] flex justify-between">
          <span>Archetype: {archetype}</span>
          <span>SYNC: COMPLETED</span>
        </div>
      </div>

      {/* Main Quests */}
      <section className="mb-8">
        <h3 className="text-sm font-bold text-amber-400 uppercase mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Priority Directives
        </h3>
        <div className="space-y-3">
          {displayMain.map((q: any) => (
            <div key={q.id} className={`p-3 rounded transition-colors ${q.status === 'ACTIVE' ? 'bg-amber-950/20 border border-amber-500/30' : 'bg-gray-900/10 border border-gray-800/30 opacity-60'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold text-sm tracking-wide ${q.status === 'ACTIVE' ? 'text-amber-200' : 'text-gray-400'}`}>{q.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${q.status === 'ACTIVE' ? 'bg-amber-900/40 text-amber-500 border-amber-900/50' : 'bg-gray-900 text-gray-500 border-gray-800'}`}>{q.status}</span>
              </div>
              <p className="text-xs text-amber-100/70 mb-2 leading-relaxed">{q.description}</p>
              <div className="text-[9px] text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <span>📍 {q.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Side Quests */}
      <section>
        <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3 border-l-2 border-cyan-600 pl-2">
          Secondary Objectives
        </h3>
        <div className="space-y-3">
          {displaySide.map((q: any) => (
            <div key={q.id} className="bg-cyan-950/10 border border-cyan-900/30 p-3 rounded hover:bg-cyan-950/20 transition-colors group">
              <div className="flex justify-between items-start mb-1">
                <span className="text-cyan-200 font-bold text-sm tracking-wide group-hover:text-cyan-100">{q.title}</span>
                <span className="text-[10px] text-cyan-600">{q.status}</span>
              </div>
              <p className="text-xs text-cyan-100/60 mb-2 leading-relaxed">{q.description}</p>
              <div className="text-[9px] text-cyan-800 uppercase tracking-wider">
                {q.location}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
