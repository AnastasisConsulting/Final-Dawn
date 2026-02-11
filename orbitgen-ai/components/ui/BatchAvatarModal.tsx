// components/ui/BatchAvatarModal.tsx
import React, { useState } from 'react';
import { generateNpcAvatar, AvatarStyle } from '../../services/gemini/visuals';

interface NpcTarget {
  id: string;
  name: string;
  description: string;
  role: string;
}

interface BatchAvatarModalProps {
  targets: NpcTarget[];
  contextName: string; // e.g., "City Alpha Squad" or "Global Population"
  onClose: () => void;
  onSave: (results: Record<string, string>) => void;
}

const STYLES: { id: AvatarStyle; label: string }[] = [
  { id: 'REALISTIC', label: 'Photoreal' },
  { id: 'CYBERPUNK', label: 'Neon Cyber' },
  { id: 'DYSTOPIAN_SCI_FI', label: 'Dystopian' },
  { id: 'DARK_NOIR_SATIRE', label: 'Noir Satire' },
  { id: 'PIXEL', label: 'Pixel Art' },
];

const BatchAvatarModal: React.FC<BatchAvatarModalProps> = ({ targets, contextName, onClose, onSave }) => {
  const [style, setStyle] = useState<AvatarStyle>('DYSTOPIAN_SCI_FI');
  const [results, setResults] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Queue processing logic
  const processQueue = async () => {
    setIsProcessing(true);
    setErrors({});
    setProgress(0);

    // Create a copy of targets to process
    const queue = [...targets];
    let completed = 0;

    // Concurrency Limit
    const CONCURRENCY = 3;
    const activePromises: Promise<void>[] = [];

    const processNext = async (npc: NpcTarget) => {
      try {
        const url = await generateNpcAvatar(npc.name, npc.description, style, `Role: ${npc.role}`);
        setResults(prev => ({ ...prev, [npc.id]: url }));
      } catch (e: any) {
        console.error(`Failed ${npc.name}`, e);
        setErrors(prev => ({ ...prev, [npc.id]: e.message || "Failed" }));
      } finally {
        completed++;
        setProgress(completed);
      }
    };

    // Execution Loop
    const execute = async () => {
        while (queue.length > 0) {
            while (activePromises.length < CONCURRENCY && queue.length > 0) {
                const npc = queue.shift();
                if (npc) {
                    const p = processNext(npc).then(() => {
                        activePromises.splice(activePromises.indexOf(p), 1);
                    });
                    activePromises.push(p);
                }
            }
            if (activePromises.length > 0) {
                await Promise.race(activePromises);
            }
        }
        await Promise.all(activePromises);
        setIsComplete(true);
        setIsProcessing(false);
    };

    execute();
  };

  const handleSaveAll = () => {
    onSave(results);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div>
                <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">Batch Avatar Generator</h2>
                <div className="text-xs text-white/50 font-mono mt-1">Target: {contextName} ({targets.length} items)</div>
            </div>
            {!isProcessing && <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>}
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Style Selector (Only if not started) */}
            {!isProcessing && !isComplete && (
                <div className="mb-6">
                    <label className="text-[10px] text-white/40 uppercase block mb-2">Select Visual Style</label>
                    <div className="grid grid-cols-5 gap-2">
                        {STYLES.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStyle(s.id)}
                                className={`py-2 text-[10px] font-bold rounded border transition-all
                                    ${style === s.id 
                                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' 
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress Area */}
            {(isProcessing || isComplete) && (
                <div className="mb-6 bg-black/40 p-4 rounded border border-white/10">
                    <div className="flex justify-between text-xs text-white mb-2 font-mono">
                        <span>PROGRESS</span>
                        <span>{progress} / {targets.length}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-cyan-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${(progress / targets.length) * 100}%` }}
                        ></div>
                    </div>
                    {isProcessing && <div className="text-[10px] text-cyan-400 mt-2 animate-pulse">Neural Rendering in progress (Batch size: 3)...</div>}
                </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {targets.map(npc => {
                    const result = results[npc.id];
                    const error = errors[npc.id];
                    return (
                        <div key={npc.id} className="aspect-square bg-white/5 rounded border border-white/5 relative group overflow-hidden">
                            {result ? (
                                <img src={result} alt={npc.name} className="w-full h-full object-cover" />
                            ) : error ? (
                                <div className="w-full h-full flex items-center justify-center bg-red-900/20 text-red-500 text-[10px] font-bold text-center p-1">
                                    ERR
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10 text-[10px]">
                                    WAITING
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-[8px] text-white truncate text-center">
                                {npc.name}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
            {!isProcessing && !isComplete && (
                <>
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white uppercase">Cancel</button>
                    <button 
                        onClick={processQueue}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold uppercase rounded shadow-lg"
                    >
                        Start Batch Generation
                    </button>
                </>
            )}

            {isProcessing && (
                 <button disabled className="px-6 py-2 bg-gray-700 text-white/50 text-xs font-bold uppercase rounded cursor-wait">
                    Processing...
                 </button>
            )}

            {isComplete && (
                <button 
                    onClick={handleSaveAll}
                    className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase rounded shadow-lg animate-bounce"
                >
                    Save {Object.keys(results).length} Avatars
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default BatchAvatarModal;