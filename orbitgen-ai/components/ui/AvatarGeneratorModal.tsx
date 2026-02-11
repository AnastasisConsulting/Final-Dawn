// components/ui/AvatarGeneratorModal.tsx
import React, { useState, useRef } from 'react';
import { generateNpcAvatar, AvatarStyle } from '../../services/gemini/visuals';

interface AvatarGeneratorModalProps {
  npc: { id: string; name: string; description: string; role: string; avatarUrl?: string };
  onClose: () => void;
  onSave: (npcId: string, avatarUrl: string) => void;
}

const STYLES: { id: AvatarStyle; label: string }[] = [
  { id: 'REALISTIC', label: 'Photoreal' },
  { id: 'CYBERPUNK', label: 'Neon Cyber' },
  { id: 'DYSTOPIAN_SCI_FI', label: 'Dystopian' },
  { id: 'DARK_NOIR_SATIRE', label: 'Noir Satire' },
  { id: 'PIXEL', label: 'Pixel Art' },
];

const AvatarGeneratorModal: React.FC<AvatarGeneratorModalProps> = ({ npc, onClose, onSave }) => {
  const [prompt, setPrompt] = useState(npc.description || "A mysterious figure.");
  const [style, setStyle] = useState<AvatarStyle>('REALISTIC');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(npc.avatarUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateNpcAvatar(npc.name, npc.role, style, prompt);
      setGeneratedUrl(url);
    } catch (e: any) {
      setError(e.message || "Failed to generate avatar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        setError("File size too large (Max 5MB).");
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        if (ev.target?.result) {
            setGeneratedUrl(ev.target.result as string);
            setError(null);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleAccept = () => {
    if (generatedUrl) {
      onSave(npc.id, generatedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-4xl h-[600px] flex shadow-2xl overflow-hidden">
        
        {/* Left: Controls */}
        <div className="w-1/3 border-r border-white/10 p-6 flex flex-col bg-black/40">
           <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-widest mb-1">Avatar Studio</h2>
           <div className="text-xs text-white/50 mb-6 font-mono">ID: {npc.id}</div>

           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
             
             {/* Target Info */}
             <div className="bg-white/5 p-3 rounded border border-white/5">
                <div className="text-[10px] text-white/40 uppercase">Target Subject</div>
                <div className="text-white font-bold">{npc.name}</div>
                <div className="text-xs text-cyan-500">{npc.role}</div>
             </div>

             {/* Style Toggles */}
             <div>
                <label className="text-[10px] text-white/40 uppercase block mb-2">Visual Style</label>
                <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStyle(s.id)}
                            className={`py-2 text-[10px] font-bold rounded border transition-all
                                ${style === s.id 
                                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-900/50' 
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
             </div>

             {/* Prompt Input */}
             <div className="flex-1 flex flex-col">
                <label className="text-[10px] text-white/40 uppercase block mb-2">Visual Directive</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 w-full bg-black/50 border border-white/10 rounded p-3 text-sm text-white focus:border-cyan-500 outline-none resize-none placeholder-white/20"
                    placeholder="Describe appearance details..."
                />
             </div>

           </div>

           <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded shadow-lg"
                >
                    {isGenerating ? "Processing..." : "Generate AI Avatar"}
                </button>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    hidden 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs font-bold uppercase rounded transition-colors"
                >
                    Upload from Device
                </button>
           </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-black/80 flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-black/50 rounded-full p-2 w-8 h-8 flex items-center justify-center">✕</button>
            
            <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,#1a1a2e_0%,#000000_100%)]">
                {generatedUrl ? (
                    <div className="relative group">
                         <img src={generatedUrl} alt="Avatar Preview" className="max-h-[400px] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" />
                         <div className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none"></div>
                    </div>
                ) : (
                    <div className="text-center opacity-30">
                        <div className="text-6xl mb-4">📷</div>
                        <div className="text-sm font-mono uppercase">No Signal</div>
                    </div>
                )}
                
                {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-xs text-cyan-400 font-mono animate-pulse">RENDERING NEURAL IMAGE...</div>
                        </div>
                    </div>
                )}
                
                {error && (
                     <div className="absolute bottom-8 left-8 right-8 bg-red-900/80 border border-red-500/50 p-4 rounded text-red-200 text-xs">
                        Error: {error}
                     </div>
                )}
            </div>

            <div className="h-20 border-t border-white/10 bg-white/5 flex items-center justify-between px-8">
                <div className="text-xs text-white/40">
                    {generatedUrl ? "Review image before accepting." : "Configure parameters or upload an image."}
                </div>
                <button 
                    onClick={handleAccept}
                    disabled={!generatedUrl || isGenerating}
                    className="px-8 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:bg-gray-700 text-white font-bold uppercase rounded"
                >
                    Accept Avatar
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AvatarGeneratorModal;