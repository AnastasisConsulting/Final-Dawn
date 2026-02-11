// components/ui/CityCard.tsx
import React from 'react';
import { City } from '../../types';
import QuestBadge from './QuestBadge';
import DefaultAvatar from './DefaultAvatar';

interface CityCardProps {
  city: City;
  onOpenAvatarStudio: (npc: any) => void;
  onOpenBatchAvatarStudio: (targets: any[], contextName: string) => void;
}

const CityCard: React.FC<CityCardProps> = ({ city, onOpenAvatarStudio, onOpenBatchAvatarStudio }) => {
  
  const handleBatchLieutenants = () => {
      const lts: any[] = [];
      city.governor?.lieutenants.forEach(lt => {
          if (!lt.avatarUrl) {
              lts.push({
                  id: lt.id, name: lt.name, description: lt.systemPrompt, role: lt.role
              });
          }
      });
      if (lts.length === 0) {
          alert("All subordinates in this city already have avatars.");
          return;
      }
      onOpenBatchAvatarStudio(lts, `${city.name} - Regional Squad`);
  };

  return (
    <div className="bg-white/5 rounded-lg border border-white/5 flex flex-col">
      {/* City Header */}
      <div className="p-4 border-b border-white/5 bg-white/5">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-cyan-200">{city.name}</h3>
            <span className="text-[9px] font-mono text-cyan-800 bg-cyan-900/20 px-1 rounded">{city.cityId}</span>
        </div>
        <p className="text-xs text-white/50 mt-1 line-clamp-2" title={city.description}>
          {city.description}
        </p>
      </div>

      {/* Governor */}
      {city.governor && (
        <div className="p-4 bg-black/20">
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-3">
                {/* Avatar / Icon */}
                <div 
                    onClick={() => onOpenAvatarStudio({ 
                        id: city.governor!.id, name: city.governor!.name, 
                        description: city.governor!.systemPrompt, role: "Governor",
                        avatarUrl: city.governor!.avatarUrl
                    })}
                    className="w-10 h-10 rounded bg-cyan-900/30 flex items-center justify-center text-cyan-400 overflow-hidden border border-white/10 relative group cursor-pointer hover:border-cyan-500/50 transition-colors"
                    title="Click to edit/upload Governor avatar"
                >
                    {city.governor.avatarUrl ? (
                         <img src={city.governor.avatarUrl} alt="Gov" className="w-full h-full object-cover" />
                    ) : (
                        <DefaultAvatar name={city.governor.name} className="w-full h-full text-lg" />
                    )}
                    {/* Hover Trigger */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[8px] text-white font-bold uppercase">Edit</span>
                    </div>
                </div>

                <div>
                    <div className="text-[10px] uppercase text-cyan-500 font-bold">Governor</div>
                    <div className="text-sm font-bold text-white leading-none">{city.governor.name}</div>
                    <div className="text-[10px] text-white/40">{city.governor.title}</div>
                </div>
            </div>

            {/* Governor System Prompt */}
            <details className="group">
                <summary className="text-[9px] text-cyan-700 cursor-pointer hover:text-cyan-500 font-mono uppercase list-none flex items-center gap-1">
                    <span className="opacity-50 group-open:rotate-90 transition-transform">▶</span> SYSTEM PROTOCOL
                </summary>
                <div className="mt-1 p-2 bg-black/80 border border-cyan-900/50 rounded text-[9px] font-mono text-cyan-400/80 leading-relaxed">
                    {city.governor.systemPrompt || "No data."}
                </div>
            </details>
          </div>

          {/* Lieutenants List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mt-4 mb-2">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">SUBORDINATES</div>
                <button 
                    onClick={handleBatchLieutenants}
                    className="text-[8px] px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 rounded uppercase"
                    title="Generate avatars for all 7 subordinates"
                >
                    Batch Gen (7)
                </button>
            </div>
            
            {city.governor.lieutenants && city.governor.lieutenants.length > 0 ? (
                city.governor.lieutenants.map((lt, lIdx) => (
              <details key={lIdx} className="group/lt">
                <summary className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <div 
                        className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10 group-hover/lt:border-white/30 hover:!border-white hover:scale-110 transition-all cursor-pointer z-10"
                        onClick={(e) => {
                            e.preventDefault(); // Stop details toggling
                            onOpenAvatarStudio({ 
                                id: lt.id, name: lt.name, 
                                description: lt.systemPrompt, role: lt.role,
                                avatarUrl: lt.avatarUrl
                            });
                        }}
                        title="Click to edit/upload NPC avatar"
                    >
                        {lt.avatarUrl ? (
                            <img src={lt.avatarUrl} alt="Lt" className="w-full h-full object-cover" />
                        ) : (
                            <DefaultAvatar name={lt.name} className="w-full h-full text-[10px]" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/80">{lt.name}</span>
                        {lt.regionName && <span className="text-[8px] text-white/20">@{lt.regionName}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30 uppercase">{lt.role}</span>
                </summary>
                
                <div className="pl-4 pr-2 py-2 mt-1 space-y-3 bg-black/40 rounded border-l border-white/10 text-xs">
                   
                   {/* Avatar Action */}
                   <button 
                        onClick={() => onOpenAvatarStudio({ 
                            id: lt.id, name: lt.name, 
                            description: lt.systemPrompt, role: lt.role,
                            avatarUrl: lt.avatarUrl
                        })}
                        className="w-full py-1 text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white/50 uppercase"
                   >
                        {lt.avatarUrl ? "Update Appearance" : "Generate Avatar"}
                   </button>

                   {/* Lieutenant System Prompt */}
                   <div className="mb-3">
                        <div className="text-[9px] font-mono text-pink-500/70 uppercase tracking-widest mb-1">NPC DIRECTIVE</div>
                        <div className="p-2 bg-black/60 border border-pink-900/30 rounded text-[9px] font-mono text-pink-200/60 leading-relaxed">
                            {lt.systemPrompt || "No directive."}
                        </div>
                   </div>

                  {lt.quests && lt.quests.length > 0 && (
                      <>
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">QUEST LOG (GIVER)</div>
                      {lt.quests.map((quest, qIdx) => (
                        <div key={qIdx} className={`p-2 rounded border ${quest.status === 'ACTIVE' ? 'border-yellow-500/20 bg-yellow-900/10' : 'border-transparent hover:bg-white/5'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold ${quest.status === 'ACTIVE' ? 'text-yellow-200' : 'text-white/70'}`}>{quest.name}</span>
                            <QuestBadge status={quest.status} checkpoint={quest.currentCheckpoint} />
                          </div>
                          <p className="text-white/50 mb-2 leading-relaxed text-[10px]">{quest.description}</p>
                          
                          {/* Triad Visualizer */}
                          <div className="flex items-center gap-1 mb-2 text-[8px] text-white/30 bg-black/40 p-1 rounded">
                             <span className="text-yellow-500">{quest.giverName}</span>
                             <span>→</span>
                             <span className="text-blue-400">{quest.middleName}</span>
                             <span>→</span>
                             <span className="text-green-500">{quest.completionName}</span>
                          </div>

                          {/* Quest Steps */}
                          <div className="space-y-1 pl-1 border-l border-white/10">
                            {quest.steps.map((step, sIdx) => {
                              const isCompleted = quest.status === 'COMPLETED' || (quest.status === 'ACTIVE' && sIdx + 1 < quest.currentCheckpoint);
                              const isCurrent = quest.status === 'ACTIVE' && sIdx + 1 === quest.currentCheckpoint;
                              return (
                                <div key={sIdx} className={`flex items-center gap-2 ${isCurrent ? 'text-white' : isCompleted ? 'text-green-500/50 line-through' : 'text-white/20'}`}>
                                  <span className="text-[8px]">{sIdx + 1}.</span>
                                  <span>{step}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      </>
                  )}
                </div>
              </details>
            ))
            ) : (
                <div className="text-[10px] text-white/20 italic p-2">No subordinates assigned.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityCard;