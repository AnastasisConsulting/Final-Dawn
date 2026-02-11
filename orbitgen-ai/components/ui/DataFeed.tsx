// components/ui/DataFeed.tsx
import React from 'react';
import { PlanetMetadata } from '../../types';
import CivilizationCard from './CivilizationCard';

interface DataFeedProps {
  metadata?: PlanetMetadata | null;
  onOpenAvatarStudio: (npc: any) => void;
  onOpenBatchAvatarStudio: (targets: any[], contextName: string) => void;
}

const DataFeed: React.FC<DataFeedProps> = ({ metadata, onOpenAvatarStudio, onOpenBatchAvatarStudio }) => {
  if (!metadata || !metadata.civilizations) return null;

  const handleGlobalBatch = () => {
    // Collect every single NPC in the world
    const allNpcs: any[] = [];
    metadata.civilizations.forEach(civ => {
        if (civ.leader && !civ.leader.avatarUrl) {
            allNpcs.push({ id: civ.leader.id, name: civ.leader.name, description: civ.leader.systemPrompt, role: "Leader" });
        }
        civ.cities.forEach(city => {
            if (city.governor && !city.governor.avatarUrl) {
                allNpcs.push({ id: city.governor.id, name: city.governor.name, description: city.governor.systemPrompt, role: "Governor" });
            }
            city.governor?.lieutenants.forEach(lt => {
                if (!lt.avatarUrl) {
                    allNpcs.push({ id: lt.id, name: lt.name, description: lt.systemPrompt, role: lt.role });
                }
            });
        });
    });

    if (allNpcs.length === 0) {
        alert("All avatars are already generated!");
        return;
    }

    onOpenBatchAvatarStudio(allNpcs, "Global Population");
  };

  return (
    <div className="w-full md:w-3/4 border-l border-white/10 pl-6 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Global Actions Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 shrink-0">
         <h2 className="text-white/40 font-mono text-xs uppercase tracking-widest">Planetary Database</h2>
         <button 
            onClick={handleGlobalBatch}
            className="px-4 py-2 bg-gradient-to-r from-purple-900 to-cyan-900 hover:from-purple-800 hover:to-cyan-800 border border-white/20 rounded text-[10px] font-bold text-white uppercase shadow-lg transition-all"
         >
            ⚡ Batch Generate All Missing Avatars
         </button>
      </div>

      {/* Civilization Data */}
      <div className="space-y-16 pb-10">
        {metadata.civilizations.map((civ, idx) => (
          <CivilizationCard 
            key={idx} 
            civ={civ} 
            index={idx} 
            onOpenAvatarStudio={onOpenAvatarStudio} 
            onOpenBatchAvatarStudio={onOpenBatchAvatarStudio}
          />
        ))}
      </div>
    </div>
  );
};

export default DataFeed;