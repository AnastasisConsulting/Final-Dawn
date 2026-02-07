import React from 'react';

interface LorePanelProps {
  data: any;
  title: string;
  type: string;
}

export const LorePanel: React.FC<LorePanelProps> = ({ data, title, type }) => {
  if (!data) return <div className="w-1/3 h-full bg-slate-950 p-6 border-l border-slate-800 text-slate-500">No Data Available</div>;

  return (
    <div className="w-1/3 h-full bg-slate-950/95 border-l border-holo-cyan p-0 overflow-y-auto text-slate-200 font-mono flex flex-col z-50 shadow-2xl relative">
       {/* Header */}
       <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-alert-orange bg-alert-orange/10 px-2 py-1 rounded border border-alert-orange/20">{type}</span>
            <span className="text-xs text-slate-500">SECURE RECORD</span>
          </div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{title}</h2>
          {data.description && <p className="text-sm text-slate-400 mt-2 italic">{data.description}</p>}
       </div>

       {/* Content Body */}
       <div className="p-6 space-y-8">
          
          {/* Governor / Leader Section */}
          {(data.governor || data.leader) && (
             <div className="bg-slate-900 p-4 rounded border border-slate-800">
                <div className="text-xs text-holo-cyan mb-2 uppercase tracking-widest font-bold">Administered By</div>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl text-slate-600">
                     ?
                   </div>
                   <div>
                      <div className="font-bold text-white">{(data.governor || data.leader).name}</div>
                      <div className="text-xs text-slate-400">{(data.governor || data.leader).title}</div>
                   </div>
                </div>
             </div>
          )}

          {/* District Inhabitants List (For Cities) */}
          {data.districts && (
            <div>
               <h3 className="text-sm font-bold text-holo-blue mb-4 uppercase border-b border-slate-800 pb-2">District Registry</h3>
               <div className="space-y-3">
                  {data.districts.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-start text-sm group cursor-help">
                       <span className="text-slate-300 group-hover:text-white transition-colors">{d.name}</span>
                       <span className="text-slate-600 text-xs text-right">{d.type}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Inhabitants List (For Districts) */}
          {data.inhabitants && (
             <div>
                <h3 className="text-sm font-bold text-holo-blue mb-4 uppercase border-b border-slate-800 pb-2">Notable Residents</h3>
                <div className="space-y-4">
                   {data.inhabitants.map((npc: any, i: number) => (
                      <div key={i} className="bg-slate-900/50 p-3 border-l-2 border-alert-orange">
                         <div className="font-bold text-white">{npc.name}</div>
                         <div className="text-xs text-alert-orange">{npc.title}</div>
                         {npc.role && <div className="text-[10px] text-slate-500 mt-1 uppercase">{npc.role}</div>}
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Coordinates / Meta */}
          {data.coordinates && (
             <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-800">
                <div>
                   <div className="text-[10px] text-slate-500 uppercase">Local Grid X</div>
                   <div className="font-mono text-lg text-holo-cyan">{data.coordinates.x}</div>
                </div>
                <div>
                   <div className="text-[10px] text-slate-500 uppercase">Local Grid Y</div>
                   <div className="font-mono text-lg text-holo-cyan">{data.coordinates.y}</div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};