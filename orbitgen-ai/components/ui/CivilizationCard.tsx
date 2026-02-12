// components/ui/CivilizationCard.tsx
import React from 'react';
import { Civilization } from '../../types';
import CityCard from './CityCard';
import GridMap from './GridMap';
import DefaultAvatar from './DefaultAvatar';

interface CivilizationCardProps {
  civ: Civilization;
  index: number;
  onOpenAvatarStudio: (npc: any) => void;
  onOpenBatchAvatarStudio: (targets: any[], contextName: string) => void;
}

const CivilizationCard: React.FC<CivilizationCardProps> = ({ civ, index, onOpenAvatarStudio, onOpenBatchAvatarStudio }) => {
  
  const handleBatchGovernors = () => {
      const govs: any[] = [];
      civ.cities.forEach(c => {
          if (c.governor && !c.governor.avatarUrl) {
              govs.push({
                  id: c.governor.id, name: c.governor.name, 
                  description: c.governor.systemPrompt, role: "Governor"
              });
          }
      });
      if (govs.length === 0) {
          alert("All governors in this civ already have avatars.");
          return;
      }
      onOpenBatchAvatarStudio(govs, `${civ.name} - Ruling Council`);
  };

  return (
    <div className="relative">
      {/* Civilization Header */}
      <div className="sticky top-0 bg-black/90 z-20 pb-4 border-b border-white/10 mb-6 pt-2">
        <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-4">
          <div>
            <span className="text-xs font-mono text-purple-500 block mb-1">CIVILIZATION ID: {index + 1}</span>
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-white">{civ.name}</h2>
                <button 
                    onClick={handleBatchGovernors}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] text-white/60 hover:text-white rounded uppercase font-bold"
                    title="Generate avatars for all 3 City Governors"
                >
                    Generate Governors (Batch)
                </button>
            </div>
            <p className="text-white/60 text-sm mt-2 max-w-2xl">{civ.description}</p>
          </div>
          {civ.leader && (
            <div className="flex flex-col gap-2 min-w-[300px]">
                <div className="text-left xl:text-right bg-white/5 p-3 rounded border border-white/5 relative group">
                    <div className="flex justify-between xl:justify-end items-start gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">LEADER</div>
                            <div className="text-white font-bold text-lg">{civ.leader.name}</div>
                            <div className="text-xs text-white/50 italic mb-2">{civ.leader.title}</div>
                        </div>
                        <div 
                            className="w-16 h-16 rounded border border-white/10 overflow-hidden cursor-pointer hover:border-white/50 transition-colors relative"
                            onClick={() => onOpenAvatarStudio({ 
                                id: civ.leader!.id, name: civ.leader!.name, 
                                description: civ.leader!.systemPrompt, role: "Leader", 
                                avatarUrl: civ.leader!.avatarUrl 
                            })}
                            title="Click to edit/upload avatar"
                        >
                            {civ.leader.avatarUrl ? (
                                <img src={civ.leader.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <DefaultAvatar name={civ.leader.name} className="w-full h-full text-2xl" />
                            )}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-2">
                        <button 
                            onClick={() => onOpenAvatarStudio({ 
                                id: civ.leader!.id, name: civ.leader!.name, 
                                description: civ.leader!.systemPrompt, role: "Leader", 
                                avatarUrl: civ.leader!.avatarUrl 
                            })}
                            className="text-[9px] px-2 py-1 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 rounded border border-purple-500/30 uppercase font-bold"
                        >
                            {civ.leader.avatarUrl ? 'Edit Avatar' : 'Gen Avatar'}
                        </button>
                    </div>

                    {/* Leader System Prompt View */}
                    <details className="text-left mt-2">
                        <summary className="text-[9px] text-purple-500 cursor-pointer hover:text-purple-300 font-mono uppercase border border-purple-500/30 rounded px-2 py-1 inline-block">
                            View System Protocol
                        </summary>
                        <div className="mt-2 p-2 bg-black/50 border border-purple-500/30 rounded text-[10px] font-mono text-purple-300/80 whitespace-pre-wrap leading-relaxed shadow-inner">
                            {civ.leader.systemPrompt || "No system directive loaded."}
                        </div>
                    </details>
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Sector Grid Map */}
        {civ.grid && (
            <div className="w-full">
                <GridMap civilization={civ} />
            </div>
        )}

        {/* Cities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {civ.cities.map((city, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-2">
                <CityCard 
                    city={city} 
                    onOpenAvatarStudio={onOpenAvatarStudio} 
                    onOpenBatchAvatarStudio={onOpenBatchAvatarStudio} 
                />
                
                {/* Regional Locales for this City */}
                <div className="bg-white/5 rounded p-2 border border-white/5">
                    <div className="text-[9px] font-mono uppercase text-white/30 mb-2 flex justify-between">
                        <span>Regional Sectors</span>
                        <span className="text-white/20">{city.regionalLocales?.length || 0} LOCS</span>
                    </div>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                        {city.regionalLocales?.map((loc, lIdx) => (
                            <div key={lIdx} className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 group">
                                <span className="text-[10px] text-white/80 truncate max-w-[70%] group-hover:text-white transition-colors">{loc.name}</span>
                                <span className={`text-[8px] px-1 rounded border min-w-[30px] text-center
                                    ${loc.type === 'DUNGEON' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}`}>
                                    {loc.type === 'DUNGEON' ? 'DGN' : 'QST'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default CivilizationCard;