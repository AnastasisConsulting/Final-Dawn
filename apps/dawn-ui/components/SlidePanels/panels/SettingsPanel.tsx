import React from 'react';
import { useGame } from '../../../src/context/GameContext';
import { RelationshipDebugger } from '../../Debug/RelationshipDebugger';
import { fetchAvailableModels } from '../../../services/llmClient';

export const SettingsPanel: React.FC = () => {
    const { state, actions } = useGame();
    const { settings } = state;

    const [availableModels, setAvailableModels] = React.useState<string[]>([]);

    React.useEffect(() => {
        const loadModels = async () => {
            const models = await fetchAvailableModels(settings.llm?.baseUrl);
            if (models.length > 0) {
                setAvailableModels(models);
            }
        };
        loadModels();
    }, [settings.llm?.baseUrl]);

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val > 0) {
            actions.updateSettings({ autoSaveInterval: val });
        }
    };

    const toggleAutoSave = () => {
        actions.updateSettings({ autoSaveEnabled: !settings.autoSaveEnabled });
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">CONFIG</div>
                    <h2 className="text-2xl font-bold text-cyan-200 uppercase">System Settings</h2>
                </div>
            </div>

            <div className="space-y-6">
                <div className="border border-neutral-800 bg-black/30 rounded p-4">
                    <div className="text-sm font-bold text-neutral-200 mb-2 uppercase tracking-wide">Persistence</div>

                    <div className="flex items-center justify-between mb-4">
                        <label className="text-neutral-400 text-sm">Auto-Save Enabled</label>
                        <button
                            onClick={toggleAutoSave}
                            className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoSaveEnabled ? 'bg-cyan-700' : 'bg-neutral-800'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-neutral-400 text-sm">Interval (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={settings.autoSaveInterval}
                            onChange={handleIntervalChange}
                            className="w-20 bg-neutral-900 border border-neutral-700 text-neutral-200 px-2 py-1 rounded text-right focus:border-cyan-500 outline-none"
                        />
                    </div>
                </div>

                <div className="border border-neutral-800 bg-black/30 rounded p-4 opacity-50 pointer-events-none">
                    <div className="text-sm font-bold text-neutral-200 mb-2 uppercase tracking-wide">Audio (Coming Soon)</div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-neutral-500 text-sm">
                            <span>Master Volume</span>
                            <span>100%</span>
                        </div>
                        <div className="flex justify-between text-neutral-500 text-sm">
                            <span>SFX</span>
                            <span>80%</span>
                        </div>
                    </div>
                </div>

                {/* Neural Link Config */}
                <div className="border border-cyan-900/40 bg-black/30 rounded p-4">
                    <div className="text-sm font-bold text-cyan-200 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                        Neural Link Configuration
                    </div>

                    <div className="space-y-4">
                        {/* Model */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-cyan-500 uppercase font-mono">Model ID</label>
                            <select
                                value={settings.llm?.model || 'llama3'}
                                onChange={(e) => actions.updateSettingsDeep({ llm: { model: e.target.value } })}
                                className="bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200 focus:border-cyan-500 outline-none font-mono"
                            >
                                <option value="llama3">llama3</option>
                                <option value="mistral">mistral</option>
                                <option value="nous-hermes">nous-hermes</option>
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vizzy Animation Model */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-purple-500 uppercase font-mono">Vizzy Logic Model</label>
                            <select
                                value={settings.llm?.vizzyModel || 'llama3'}
                                onChange={(e) => actions.updateSettingsDeep({ llm: { vizzyModel: e.target.value } })}
                                className="bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-purple-200 focus:border-purple-500 outline-none font-mono"
                            >
                                <option value="llama3">llama3</option>
                                <option value="mistral">mistral</option>
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Embedding Model */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-emerald-500 uppercase font-mono">Embedding Model</label>
                            <select
                                value={settings.llm?.embeddingModel || 'nomic-embed-text'}
                                onChange={(e) => actions.updateSettingsDeep({ llm: { embeddingModel: e.target.value } })}
                                className="bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-emerald-200 focus:border-emerald-500 outline-none font-mono"
                            >
                                <option value="nomic-embed-text">nomic-embed-text (Default)</option>
                                <option value="mxbai-embed-large">mxbai-embed-large</option>
                                <option value="all-minilm">all-minilm</option>
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Memory Parameters */}
                        <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-2 mt-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-neutral-400 uppercase font-mono">Embeddings (Min-Max)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number" min="1" max="7"
                                        value={settings.llm?.minEmbeddings || 1}
                                        onChange={(e) => actions.updateSettingsDeep({ llm: { minEmbeddings: parseInt(e.target.value) } })}
                                        className="w-full bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200 focus:border-cyan-500 outline-none font-mono text-center"
                                    />
                                    <input
                                        type="number" min="1" max="7"
                                        value={settings.llm?.maxEmbeddings || 7}
                                        onChange={(e) => actions.updateSettingsDeep({ llm: { maxEmbeddings: parseInt(e.target.value) } })}
                                        className="w-full bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200 focus:border-cyan-500 outline-none font-mono text-center"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-neutral-400 uppercase font-mono">Assoc. Tags (Min-Max)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number" min="1" max="7"
                                        value={settings.llm?.minTags || 1}
                                        onChange={(e) => actions.updateSettingsDeep({ llm: { minTags: parseInt(e.target.value) } })}
                                        className="w-full bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200 focus:border-cyan-500 outline-none font-mono text-center"
                                    />
                                    <input
                                        type="number" min="1" max="7"
                                        value={settings.llm?.maxTags || 7}
                                        onChange={(e) => actions.updateSettingsDeep({ llm: { maxTags: parseInt(e.target.value) } })}
                                        className="w-full bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200 focus:border-cyan-500 outline-none font-mono text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* URL */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-cyan-500 uppercase font-mono">Bridge URL</label>
                            <input
                                type="text"
                                value={settings.llm?.baseUrl || 'http://127.0.0.1:11434'}
                                onChange={(e) => actions.updateSettingsDeep({ llm: { baseUrl: e.target.value } })}
                                className="bg-neutral-900/80 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-200 focus:border-cyan-500 outline-none font-mono"
                                placeholder="http://127.0.0.1:11434"
                            />
                        </div>

                        {/* Temp */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <label className="text-xs text-cyan-500 uppercase font-mono">Creativity (Temp)</label>
                                <span className="text-xs text-cyan-200 font-mono">{settings.llm?.temperature || 0.7}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.llm?.temperature || 0.7}
                                onChange={(e) => actions.updateSettingsDeep({ llm: { temperature: parseFloat(e.target.value) } })}
                                className="accent-cyan-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Relationship Debugger */}
                <RelationshipDebugger />
            </div>

            <div className="mt-auto text-center">
                <div className="text-[10px] text-neutral-600 font-mono">
                    DAWN-OS v2.4.1 // UNREGISTERED HYPERVISOR
                </div>
            </div>
        </div >
    );
};
