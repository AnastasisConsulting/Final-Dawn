// G_ynthetic/components/ConfigModal.tsx
import React, { useRef, useState } from 'react';
import { ConfigAPI, MemoryState, MemorySetters } from '../hooks/useConfig';
import { AvatarDisplay } from './AvatarDisplay';
import { SavedCard } from '../types';
import { warmupModel } from '../services/ollamaService'; 
import { CreatorPanel } from './CreatorPanel'; // Import new component

interface ConfigModalProps {
    config: ConfigAPI & { memoryState: MemoryState, memorySetters: MemorySetters };
    onApplySettings: () => void;
    onCancel: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ config, onApplySettings, onCancel }) => {
    const {
        tempConfig, setTempConfig,
        showConfig, setActiveTab, activeTab,
        aiProvider, setAiProvider, geminiApiKey, setGeminiApiKey, openaiApiKey, setOpenAIApiKey, anthropicApiKey, setAnthropicApiKey,
        ollamaUrl, setOllamaUrl, ollamaModel, setOllamaModel, availableOllamaModels, ollamaStatus, fetchOllamaModels, 
        
        // F.R.A.C.C. Flags
        useFractalOrchestration, setUseFractalOrchestration,
        useFastPath, setUseFastPath, 
        useCoralScorer, setUseCoralScorer,
        usePhaseAgents, setUsePhaseAgents,
        useDecomposerSynthesizer, setUseDecomposerSynthesizer,

        // F.R.A.C.C. Agents
        ollamaDecomposerModel, setOllamaDecomposerModel,
        ollamaPhase1Model, setOllamaPhase1Model,
        ollamaPhase2Model, setOllamaPhase2Model,
        ollamaPhase3Model, setOllamaPhase3Model,
        ollamaSynthesizerModel, setOllamaSynthesizerModel,

        // Library & Creator
        library, handleLoadFromLibrary, handleDeleteCard, parseJsonCard, parseJsonCardToSavedCard, setLibrary,
        // (Creator fields handled inside CreatorPanel now)
        
        // NEW STATE HANDLERS & DATA
        handleExportState, handleImportState,
        memoryState, memorySetters
    } = config;
    
    const stateInputRef = useRef<HTMLInputElement>(null);
    const [isWarming, setIsWarming] = useState(false);

    const currentMode = !useFractalOrchestration ? 'standard' : useFastPath ? 'fast' : 'deep';

    const setPipelineMode = (mode: 'standard' | 'fast' | 'deep') => {
        if (mode === 'standard') {
            setUseFractalOrchestration(false);
            setUseFastPath(false);
        } else if (mode === 'fast') {
            setUseFractalOrchestration(true);
            setUseFastPath(true);
        } else {
            setUseFractalOrchestration(true);
            setUseFastPath(false);
        }
    };

    const handleSmartWarmup = async () => {
        setIsWarming(true);
        try {
            if (currentMode === 'fast') {
                if (ollamaSynthesizerModel) await warmupModel(ollamaUrl, ollamaSynthesizerModel);
                if (ollamaDecomposerModel) await warmupModel(ollamaUrl, ollamaDecomposerModel);
                alert(`⚡ REALTIME PIPELINE WARMED`);
            } else if (currentMode === 'deep') {
                const agents = [ollamaDecomposerModel, ollamaPhase1Model, ollamaPhase2Model, ollamaPhase3Model, ollamaSynthesizerModel];
                for (const agent of agents) {
                    if (agent) await warmupModel(ollamaUrl, agent);
                }
                alert(`🧠 AGENTIC SWARM WARMED`);
            } else {
                if (ollamaModel) await warmupModel(ollamaUrl, ollamaModel);
                alert(`STANDARD MODEL WARMED: ${ollamaModel}`);
            }
        } catch (e: any) {
            alert(`Warmup Failed:\n${e.message || e}`);
        } finally {
            setIsWarming(false);
        }
    };

    const handleFolderImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach((file: File) => { 
            if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const json = JSON.parse(ev.target?.result as string);
                        const card = parseJsonCardToSavedCard(json as any); 
                        if (card) {
                            setLibrary(prev => { 
                                if (prev.some(c => c.name === card.name)) return prev;
                                return [...prev, card];
                            });
                        }
                    } catch (e) { }
                };
                reader.readAsText(file);
            }
        });
        alert(`Scanning folder for .json cards...`);
    };

    const handleStateImportProxy = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImportState(file, memorySetters);
            e.target.value = ''; 
        }
    };
    
    if (!showConfig) return null;

    return ( 
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-10">
            <div className="w-full max-w-4xl border border-white/20 bg-neutral-900 rounded-lg shadow-2xl flex flex-col h-5/6">
                
                <div className="p-6 border-b border-white/10 bg-black/50 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-white tracking-widest">NEURAL CONFIGURATION / {activeTab.toUpperCase()}</h2>
                    <button onClick={onCancel} className="px-4 py-1 text-xs font-bold text-neutral-500 hover:text-red-400 transition-colors border border-transparent">[CLOSE]</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    
                    {/* PERSONA TAB */}
                    {activeTab === 'persona' && (
                        <div className="space-y-6 w-full animate-fade-in">
                            <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest border-b border-cyan-900/50 pb-2 mb-4">Player Identity</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1">
                                     <label className="block text-xs text-neutral-500 mb-2 font-mono">USER AVATAR</label>
                                     <div className="relative w-full aspect-square bg-black border border-neutral-700 rounded-lg flex items-center justify-center group overflow-hidden">
                                        <AvatarDisplay name={tempConfig.userName} avatar={tempConfig.userAvatar} size="xl" className="w-full h-full" />
                                     </div>
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1 font-mono">USER NAME</label>
                                        <input type="text" value={tempConfig.userName} onChange={e => setTempConfig({...tempConfig, userName: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-cyan-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SIMULATION TAB */}
                    {activeTab === 'simulation' && (
                        <div className="space-y-6 w-full animate-fade-in">
                            <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest border-b border-purple-900/50 pb-2 mb-4">World & AI Character</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1 font-mono">WORLD NAME (SCENARIO)</label>
                                    <input type="text" value={tempConfig.worldName} onChange={e => setTempConfig({...tempConfig, worldName: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1 font-mono">AI NAME</label>
                                    <input type="text" value={tempConfig.aiName} onChange={e => setTempConfig({...tempConfig, aiName: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-purple-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                     <label className="block text-xs text-neutral-500 mb-1 font-mono">AI AVATAR</label>
                                     <AvatarDisplay name={tempConfig.aiName} avatar={tempConfig.avatar} size="lg" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-neutral-500 mb-1 font-mono">AI PERSONA / DEFINITION</label>
                                    <textarea value={tempConfig.persona} onChange={e => setTempConfig({...tempConfig, persona: e.target.value})} rows={8} className="w-full bg-black border border-neutral-700 p-2 text-xs text-neutral-300 focus:border-purple-500 outline-none resize-none font-mono leading-relaxed" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LLM TAB */}
                    {activeTab === 'llm' && (
                        <div className="space-y-8 w-full animate-fade-in">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest border-b border-blue-900/50 pb-2">LLM Service</h3>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1 font-mono">AI PROVIDER</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={() => setAiProvider('ollama')} className={`py-2 text-xs border ${aiProvider === 'ollama' ? 'bg-blue-900/40 border-blue-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>LOCAL OLLAMA</button>
                                        <button onClick={() => setAiProvider('gemini')} className={`py-2 text-xs border ${aiProvider === 'gemini' ? 'bg-blue-900/40 border-blue-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>GOOGLE GEMINI</button>
                                        <button onClick={() => setAiProvider('openai')} className={`py-2 text-xs border ${aiProvider === 'openai' ? 'bg-blue-900/40 border-blue-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>OPENAI</button>
                                        <button onClick={() => setAiProvider('anthropic')} className={`py-2 text-xs border ${aiProvider === 'anthropic' ? 'bg-blue-900/40 border-blue-500 text-white' : 'border-neutral-700 text-neutral-500'}`}>ANTHROPIC</button>
                                    </div>
                                </div>
                                {aiProvider === 'gemini' && <input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Enter GEMINI_API_KEY..." />}
                                {aiProvider === 'openai' && <input type="password" value={openaiApiKey} onChange={e => setOpenAIApiKey(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Enter OPENAI_API_KEY..." />}
                                {aiProvider === 'anthropic' && <input type="password" value={anthropicApiKey} onChange={e => setAnthropicApiKey(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Enter ANTHROPIC_API_KEY..." />}
                                
                                {aiProvider === 'ollama' && (
                                    <div className="p-4 border border-blue-900/30 bg-blue-900/10 rounded space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] text-neutral-500 mb-1 font-mono">OLLAMA SERVER URL</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} className="flex-1 bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-blue-500 outline-none font-mono" />
                                                <button onClick={fetchOllamaModels} className="px-3 py-2 text-[10px] border border-blue-700 text-blue-500 hover:bg-blue-900/30 flex-shrink-0">REFRESH MODELS</button>
                                            </div>
                                            <div className="text-[10px]">
                                                STATUS: {ollamaStatus === 'online' ? <span className="text-green-500">ONLINE</span> : <span className="text-red-500">{ollamaStatus.toUpperCase()}</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] text-neutral-500 mb-1 font-mono uppercase">Architecture Pipeline</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => setPipelineMode('standard')} className={`p-2 border text-[10px] ${currentMode === 'standard' ? 'bg-blue-500 text-black border-blue-400' : 'bg-black border-neutral-700 text-neutral-500'}`}>STANDARD RAG</button>
                                                <button onClick={() => setPipelineMode('fast')} className={`p-2 border text-[10px] ${currentMode === 'fast' ? 'bg-green-500 text-black border-green-400' : 'bg-black border-neutral-700 text-neutral-500'}`}>REALTIME (FAST)</button>
                                                <button onClick={() => setPipelineMode('deep')} className={`p-2 border text-[10px] ${currentMode === 'deep' ? 'bg-purple-500 text-black border-purple-400' : 'bg-black border-neutral-700 text-neutral-500'}`}>AGENTIC SWARM</button>
                                            </div>
                                        </div>
                                        {currentMode === 'standard' && (
                                            <div>
                                                <label className="block text-[10px] text-blue-300 mb-1 font-mono">STANDARD MODEL</label>
                                                <select value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 text-xs text-white outline-none">
                                                    {availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {currentMode === 'fast' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] text-green-300 mb-1 font-mono">INTERACTION MODEL</label>
                                                    <select value={ollamaSynthesizerModel} onChange={(e) => setOllamaSynthesizerModel(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 text-xs text-white outline-none">
                                                        {availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-green-300 mb-1 font-mono">SENSOR MODEL</label>
                                                    <select value={ollamaDecomposerModel} onChange={(e) => setOllamaDecomposerModel(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 text-xs text-white outline-none">
                                                        {availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        {currentMode === 'deep' && (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                     <select value={ollamaDecomposerModel} onChange={(e) => setOllamaDecomposerModel(e.target.value)} className="w-full bg-black border border-neutral-700 p-1 text-[10px] text-white"><option disabled value="">Decomposer</option>{availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                     <select value={ollamaSynthesizerModel} onChange={(e) => setOllamaSynthesizerModel(e.target.value)} className="w-full bg-black border border-neutral-700 p-1 text-[10px] text-white"><option disabled value="">Synthesizer</option>{availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                     <select value={ollamaPhase1Model} onChange={(e) => setOllamaPhase1Model(e.target.value)} className="w-full bg-black border border-neutral-700 p-1 text-[10px] text-white"><option disabled value="">Phase 1</option>{availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                     <select value={ollamaPhase2Model} onChange={(e) => setOllamaPhase2Model(e.target.value)} className="w-full bg-black border border-neutral-700 p-1 text-[10px] text-white"><option disabled value="">Phase 2</option>{availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                     <select value={ollamaPhase3Model} onChange={(e) => setOllamaPhase3Model(e.target.value)} className="w-full bg-black border border-neutral-700 p-1 text-[10px] text-white"><option disabled value="">Phase 3</option>{availableOllamaModels.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                </div>
                                            </div>
                                        )}
                                        <div className="pt-2 flex justify-end">
                                            <button onClick={handleSmartWarmup} disabled={isWarming} className="px-4 py-2 text-xs font-bold border rounded bg-blue-900/30 border-blue-500 text-blue-300">
                                                {isWarming ? "WARMING UP..." : `WARMUP ${currentMode.toUpperCase()}`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* SECTION 2: APP STATE */}
                            <div className="space-y-4 pt-4">
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest border-b border-blue-900/50 pb-2">
                                    System State Management
                                </h3>
                                <div className="p-4 border border-blue-900/30 bg-blue-900/10 rounded space-y-4">
                                    <p className="text-[10px] text-neutral-400">
                                        Export/Import the entire G_ynthetic state (Memory, Log, Config, F.R.A.C.C. settings).
                                    </p>
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            onClick={() => handleExportState(memoryState)}
                                            className="flex-1 py-2 bg-black border border-blue-700 text-blue-400 hover:text-white text-xs font-bold"
                                        >
                                            ⬇ EXPORT FULL STATE
                                        </button>
                                        <label className="flex-1 py-2 bg-blue-800 text-white hover:bg-blue-700 text-xs font-bold text-center cursor-pointer rounded">
                                            UPLOAD STATE
                                            <input type="file" ref={stateInputRef} accept=".json" onChange={handleStateImportProxy} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LIBRARY TAB */}
                    {activeTab === 'library' && (
                         <div className="space-y-6 w-full animate-fade-in">
                            <div className="flex gap-4 items-end">
                                 <div className="flex-1">
                                    <label className="block text-xs text-green-500 mb-1 font-mono font-bold">SCAN FOLDER</label>
                                    <input type="file" 
                                        // @ts-ignore
                                        webkitdirectory="" directory="" multiple onChange={handleFolderImport} 
                                        className="text-xs text-neutral-500 w-full border border-neutral-800 p-2 rounded bg-black" 
                                    />
                                 </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {library.map(card => (
                                    <div key={card.id} onClick={() => handleLoadFromLibrary(card)} className="group relative border border-neutral-800 bg-black/40 hover:bg-neutral-900 hover:border-green-500/50 p-3 rounded cursor-pointer transition-all flex flex-col items-center gap-3">
                                        <AvatarDisplay name={card.name} avatar={card.avatar} size="lg" />
                                        <div className="text-center">
                                            <div className="font-bold text-sm text-white">{card.name}</div>
                                            <div className="text-[10px] text-neutral-500 line-clamp-2">{card.description}</div>
                                        </div>
                                        <button onClick={(e) => handleDeleteCard(card.id, e)} className="absolute top-2 right-2 text-neutral-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CREATOR TAB - Now uses extracted component */}
                    {activeTab === 'creator' && (
                        <CreatorPanel config={config} />
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-black/50 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white">CANCEL</button>
                    <button onClick={onApplySettings} className="px-6 py-2 text-xs font-bold bg-cyan-900 text-cyan-100 hover:bg-cyan-800 border border-cyan-700">APPLY SETTINGS</button>
                </div>
            </div>
        </div>
    );
};