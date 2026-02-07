import React, { useEffect, useMemo, useState } from 'react';
import { loadLlmConfig, saveLlmConfig } from '../../services/llmConfig';

type OllamaModel = { name: string };
type Service = 'ollama';

interface WarmStatus {
  state: 'idle' | 'loading' | 'warming' | 'ready' | 'error';
  message?: string;
}

export const LlmTankPanel: React.FC = () => {
  const saved = loadLlmConfig();
  const [service, setService] = useState<Service>('ollama');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>(saved.baseUrl);
  const [apiKey, setApiKey] = useState<string>(saved.apiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(saved.geminiApiKey || '');
  const [geminiTextModel, setGeminiTextModel] = useState<string>(saved.geminiTextModel || 'gemini-2.0-flash');
  const [geminiImageModel, setGeminiImageModel] = useState<string>(saved.geminiImageModel || 'gemini-1.5-flash');
  const [personaModels, setPersonaModels] = useState(saved.models);
  const [status, setStatus] = useState<WarmStatus>({ state: 'idle', message: 'Select a model to warm for 30 minutes.' });

  const serviceLabel = useMemo(() => service === 'ollama' ? 'Ollama (local)' : 'Unknown', [service]);

  const pingService = async () => {
    if (service !== 'ollama') return;
    setStatus({ state: 'loading', message: 'Pinging service...' });
    try {
      const res = await fetch(`${baseUrl || 'http://localhost:11434'}/api/tags`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: OllamaModel[] = Array.isArray(data.models) ? data.models.map((m: any) => ({ name: m.name })) : [];
      setModels(list);
      if (list.length > 0) setSelectedModel(prev => prev || list[0].name);

      // If saved persona models are not in the fetched list, reset them to the first available.
      const names = new Set(list.map(m => m.name));
      if (list.length > 0) {
        setPersonaModels(prev => ({
          lyra: names.has(prev.lyra) ? prev.lyra : list[0].name,
          navbot: names.has(prev.navbot) ? prev.navbot : list[0].name,
          vizzy: names.has(prev.vizzy) ? prev.vizzy : list[0].name,
        }));
      }
      setStatus({ state: 'idle', message: list.length ? 'Service reachable. Pick a model to warm.' : 'No models found.' });
    } catch (err: any) {
      setStatus({ state: 'error', message: `Ping failed: ${err?.message || 'unknown error'}` });
    }
  };

  useEffect(() => { pingService(); }, [service, baseUrl]);

  const warmModel = async (model: string) => {
    if (!model) return;
    setStatus({ state: 'warming', message: `Warming ${model} (keep_alive=30m)...` });
    try {
      const res = await fetch(`${baseUrl || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({
          model,
          prompt: 'ping',
          stream: false,
          keep_alive: '30m',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus({ state: 'ready', message: `${model} warmed. TTL set to 30m.` });
    } catch (err: any) {
      setStatus({ state: 'error', message: `Warm-up failed: ${err?.message || 'unknown error'}` });
    }
  };

  // Auto-warm when model selection changes
  useEffect(() => {
    if (selectedModel) warmModel(selectedModel);
  }, [selectedModel]);

  // Persist config
  useEffect(() => {
    saveLlmConfig({
      baseUrl: baseUrl || 'http://127.0.0.1:11434',
      apiKey,
      geminiApiKey,
      geminiTextModel,
      geminiImageModel,
      models: personaModels
    });
  }, [baseUrl, apiKey, geminiApiKey, geminiTextModel, geminiImageModel, personaModels]);

  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">LLM Tank</div>
      <p className="text-neutral-400 text-sm">
        Configure service, API key, and per-persona models. Warm-up pings the model and pins it for 30 minutes.
      </p>

      <div className="grid grid-cols-2 gap-2 items-center text-sm">
        <div className="text-neutral-500">Service</div>
        <select
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={service}
          onChange={(e) => setService(e.target.value as Service)}
        >
          <option value="ollama">Ollama (local)</option>
        </select>

        <div className="text-neutral-500">Base URL</div>
        <input
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="http://127.0.0.1:11434"
        />

        <div className="text-neutral-500">API Key (if required)</div>
        <input
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Bearer token (optional)"
        />

        <div className="text-neutral-500">Model (warm)</div>
        <select
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!models.length || status.state === 'loading'}
        >
          {models.map(m => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 items-center text-sm">
        <div className="text-neutral-500">Lyra Model</div>
        <select
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={personaModels.lyra}
          onChange={(e) => setPersonaModels(prev => ({ ...prev, lyra: e.target.value }))}
        >
          {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
        <div className="text-neutral-500">NavBot Model</div>
        <select
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={personaModels.navbot}
          onChange={(e) => setPersonaModels(prev => ({ ...prev, navbot: e.target.value }))}
        >
          {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
        <div className="text-neutral-500">Vizzy Model</div>
        <select
          className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
          value={personaModels.vizzy}
          onChange={(e) => setPersonaModels(prev => ({ ...prev, vizzy: e.target.value }))}
        >
          {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/5 text-sm">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Gemini Settings</div>
        <label className="flex flex-col gap-1 text-neutral-400 text-xs">
          <span>Gemini API Key</span>
          <input
            className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Gemini API key for text/image"
          />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400 text-xs">
          <span>Gemini Text Model</span>
          <input
            className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
            value={geminiTextModel}
            onChange={(e) => setGeminiTextModel(e.target.value)}
            placeholder="gemini-2.0-flash"
          />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400 text-xs">
          <span>Gemini Image Model</span>
          <input
            className="bg-black/40 border border-cyan-900/50 text-cyan-200 px-2 py-1"
            value={geminiImageModel}
            onChange={(e) => setGeminiImageModel(e.target.value)}
            placeholder="gemini-1.5-flash"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 bg-cyan-600/30 border border-cyan-500/60 text-cyan-100 text-xs uppercase tracking-widest hover:bg-cyan-500/40 active:scale-95 disabled:opacity-50"
          onClick={() => warmModel(selectedModel)}
          disabled={!selectedModel || status.state === 'loading' || status.state === 'warming'}
        >
          Warm & Pin 30m
        </button>
        <button
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs uppercase tracking-widest hover:bg-neutral-700 active:scale-95"
          onClick={pingService}
          disabled={status.state === 'loading'}
        >
          Ping & Refresh
        </button>
      </div>

      <div className={`
        text-xs font-mono p-3 border rounded 
        ${status.state === 'error' ? 'border-red-700 text-red-300 bg-red-950/30' : 
          status.state === 'ready' ? 'border-green-700 text-green-300 bg-green-950/20' : 
          'border-cyan-900 text-cyan-200 bg-black/40'}
      `}>
        <div className="font-semibold">Service: {serviceLabel}</div>
        <div className="mt-1">{status.message}</div>
        <div className="mt-1 text-[10px] text-neutral-500">Base: {baseUrl || 'http://127.0.0.1:11434'}</div>
      </div>
    </div>
  );
};
