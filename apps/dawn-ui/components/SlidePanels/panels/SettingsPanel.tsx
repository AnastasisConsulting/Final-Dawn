import React, { useState, useEffect } from 'react';
import { useGame } from '../../../src/context/GameContext';
import { fetchAvailableModels } from '../../../services/llmClient';

const DEFAULT_MODELS = [
    'none',
    'llama3',
    'mistral',
    'gemma:2b',
    'phi3',
    'nomic-embed-text',
    'mxbai-embed-large'
];

export const SettingsPanel: React.FC = () => {
    const { state, actions } = useGame();
    const { settings } = state;
    const [availableModels, setAvailableModels] = useState<string[]>(DEFAULT_MODELS);
    const [modelSource, setModelSource] = useState<string>('defaults');

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const preferred = settings.llm.baseUrl || 'http://127.0.0.1:11434';

                const attempts: Array<{ baseUrl: string; label: string }> = [
                    { baseUrl: preferred, label: `ollama:${preferred}` },
                    { baseUrl: 'http://127.0.0.1:11434', label: 'ollama:http://127.0.0.1:11434' },
                    { baseUrl: 'http://localhost:11434', label: 'ollama:http://localhost:11434' },
                    // Backend proxy route (still resolves to local Ollama).
                    { baseUrl: 'http://localhost:4000', label: 'proxy:http://localhost:4000/api/tags' },
                ];

                let fetchedModels: string[] = [];
                let picked = 'defaults';

                for (const a of attempts) {
                    fetchedModels = await fetchAvailableModels(a.baseUrl);
                    if (fetchedModels.length > 0) {
                        picked = a.label;
                        break;
                    }
                }

                // Merge with defaults, unique only
                const allModels = Array.from(new Set([...fetchedModels, ...DEFAULT_MODELS]));
                setAvailableModels(allModels.sort());
                setModelSource(picked);
            } catch (err) {
                console.warn('Ollama unavailable, using defaults', err);
                setModelSource('defaults');
            }
        };
        fetchModels();
    }, [settings.llm.baseUrl]);

    const handleChange = (key: keyof typeof settings.llm, value: any) => {
        actions.updateSettingsDeep({
            llm: {
                ...settings.llm,
                [key]: value
            }
        });
    };

    const handlePerformanceToggle = (enabled: boolean) => {
        const next = {
            ...settings.llm,
            performanceMode: enabled
        };
        if (enabled) {
            next.embeddingModel = 'none';
            next.minEmbeddings = 0;
            next.enableTagLLM = false;
        }
        actions.updateSettingsDeep({ llm: next });
    };

    return (
        <div className="h-full w-full p-4 text-cyan-100 font-mono overflow-y-auto custom-scrollbar flex flex-col gap-6">

            <div className="border-b border-cyan-500/30 pb-2">
                <h2 className="text-xl font-bold text-cyan-400 tracking-widest uppercase">SYSTEM_CONFIG</h2>
                <div className="text-[10px] text-cyan-600 uppercase">Ollama Inference Parameters</div>
            </div>

            <section className="space-y-4">
                <h3 className="text-sm font-bold text-fuchsia-400 uppercase border-l-2 border-fuchsia-500 pl-2">
                    Model Selection
                </h3>
                <div className="text-[10px] text-cyan-700 uppercase tracking-widest">
                    Model Source: <span className="text-cyan-400">{modelSource}</span>
                </div>

                {/* Chat Model */}
                <div className="bg-black/90 p-3 rounded border border-cyan-900/50 shadow-[0_0_15px_rgba(8,145,178,0.1)]">
                    <label className="text-[10px] text-cyan-500 uppercase tracking-widest block mb-2 font-bold">Primary Chat Model</label>
                    <div className="relative group">
                        <select
                            value={settings.llm.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                            className="w-full appearance-none bg-[#050505] border border-cyan-800 text-cyan-50 text-xs p-3 rounded-sm focus:border-cyan-400 outline-none transition-all group-hover:border-cyan-600 font-mono uppercase tracking-wider"
                        >
                            {availableModels.map(m => <option key={m} value={m} className="bg-black text-white">{m.toUpperCase()}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none text-[10px]">▼</div>
                    </div>
                </div>

                {/* Vizzy Model */}
                <div className="bg-black/90 p-3 rounded border border-fuchsia-900/50 shadow-[0_0_15px_rgba(192,38,211,0.1)]">
                    <label className="text-[10px] text-fuchsia-500 uppercase tracking-widest block mb-2 font-bold">Vizzy (Logic) Model</label>
                    <div className="relative group">
                        <select
                            value={settings.llm.vizzyModel || settings.llm.model}
                            onChange={(e) => handleChange('vizzyModel', e.target.value)}
                            className="w-full appearance-none bg-[#050505] border border-fuchsia-800 text-fuchsia-50 text-xs p-3 rounded-sm focus:border-fuchsia-400 outline-none transition-all group-hover:border-fuchsia-600 font-mono uppercase tracking-wider"
                        >
                            {availableModels.map(m => <option key={m} value={m} className="bg-black text-white">{m.toUpperCase()}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fuchsia-600 pointer-events-none text-[10px]">▼</div>
                    </div>
                </div>

                {/* Embedding Model */}
                <div className="bg-black/90 p-3 rounded border border-emerald-900/50 shadow-[0_0_15px_rgba(22,163,74,0.1)]">
                    <label className="text-[10px] text-emerald-500 uppercase tracking-widest block mb-2 font-bold">Embedding Model</label>
                    <div className="relative group">
                        <select
                            value={settings.llm.embeddingModel || 'nomic-embed-text'}
                            onChange={(e) => handleChange('embeddingModel', e.target.value)}
                            className="w-full appearance-none bg-[#050505] border border-emerald-800 text-emerald-50 text-xs p-3 rounded-sm focus:border-emerald-400 outline-none transition-all group-hover:border-emerald-600 font-mono uppercase tracking-wider"
                        >
                            {availableModels.map(m => <option key={m} value={m} className="bg-black text-white">{m.toUpperCase()}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none text-[10px]">▼</div>
                    </div>
                    <div className="mt-2 text-[9px] text-emerald-400/70 uppercase tracking-widest">Set to NONE to disable embeddings</div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-400 uppercase border-l-2 border-yellow-500 pl-2">
                    Inference Settings
                </h3>

                <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/10">
                    <label className="text-xs text-neutral-400">Performance Mode</label>
                    <input
                        type="checkbox"
                        checked={!!settings.llm.performanceMode}
                        onChange={(e) => handlePerformanceToggle(e.target.checked)}
                        className="h-4 w-4 accent-yellow-400"
                    />
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    Disables NPC/landmark scaffolding and embeddings for faster turns.
                </div>

                <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/10">
                    <label className="text-xs text-neutral-400">Temperature</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={settings.llm.temperature}
                        onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                        className="bg-transparent text-right text-yellow-400 font-bold w-20 outline-none border-b border-yellow-800 focus:border-yellow-400"
                    />
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/10">
                    <label className="text-xs text-neutral-400">Context Window</label>
                    <span className="text-xs text-neutral-600 font-mono">Dynamic</span>
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-cyan-500/10">
                <h3 className="text-sm font-bold text-cyan-400 uppercase border-l-2 border-cyan-500 pl-2">
                    Intelligence & Assets
                </h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => window.open('https://github.com/your-username/final-dawn-of-eideus#readme', '_blank')}
                        className="w-full bg-cyan-950/30 border border-cyan-800/50 p-2 text-left text-[10px] hover:bg-cyan-900/50 hover:border-cyan-400 transition-all uppercase tracking-widest text-cyan-300"
                    >
                        [SYSTEM_ARCHITECTURE_v1.0]
                    </button>
                    <button
                        onClick={() => window.open('https://github.com/your-username/final-dawn-of-eideus/blob/main/LICENSE', '_blank')}
                        className="w-full bg-emerald-950/30 border border-emerald-800/50 p-2 text-left text-[10px] hover:bg-emerald-900/50 hover:border-emerald-400 transition-all uppercase tracking-widest text-emerald-300"
                    >
                        [LICENSING_PROTOCOLS]
                    </button>
                </div>
            </section>

        </div>
    );
};
