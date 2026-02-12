// PATH: components/ui/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { AppSettings, LLMProvider } from '../../types';
import { getSettings, saveSettings } from '../../services/settingsService';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [activeTab, setActiveTab] = useState<LLMProvider>('gemini');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(settings.provider);
    if (settings.provider === 'ollama') {
      fetchOllamaModels(settings.ollama.baseUrl);
    }
  }, []);

  const fetchOllamaModels = async (baseUrl: string) => {
    setIsFetchingModels(true);
    setFetchError(null);
    try {
      // Clean trailing slash
      const cleanUrl = baseUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/tags`);
      
      if (!response.ok) {
        throw new Error(`Failed to connect. Status: ${response.status}`);
      }
      
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      setOllamaModels(models);
      
      // Auto-select first model if current selection is invalid
      if (models.length > 0 && !models.includes(settings.ollama.model)) {
        updateOllamaSetting('model', models[0]);
      }
    } catch (e: any) {
      console.error("Ollama fetch error:", e);
      setFetchError(e.message || "Connection Failed");
      setOllamaModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = () => {
    const finalSettings = { ...settings, provider: activeTab };
    saveSettings(finalSettings);
    // Reload to apply provider changes implicitly (or handle via context in future)
    // For now, simple save.
    onClose();
  };

  const updateOllamaSetting = (key: keyof typeof settings.ollama, value: string) => {
    setSettings(prev => ({
      ...prev,
      ollama: { ...prev.ollama, [key]: value }
    }));
  };

  const copyPowerShellCmd = () => {
    const cmd = '$env:OLLAMA_ORIGINS="*"; ollama serve';
    navigator.clipboard.writeText(cmd);
    alert("Command copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">System Configuration</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'gemini' ? 'bg-cyan-900/20 text-cyan-400 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            Google Gemini
          </button>
          <button 
            onClick={() => setActiveTab('ollama')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'ollama' ? 'bg-orange-900/20 text-orange-400 border-b-2 border-orange-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            Local Ollama
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'gemini' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded text-sm text-cyan-200">
                <div className="font-bold mb-2">Authenticated via Environment</div>
                <p className="opacity-70">
                  The Google Gemini API key is configured securely via the application environment (process.env.API_KEY). 
                  No manual configuration is required here.
                </p>
              </div>
              
              <div className="opacity-50 pointer-events-none grayscale">
                <label className="block text-xs font-mono text-white/40 uppercase mb-1">Model Selection (Managed)</label>
                <select className="w-full bg-black/40 border border-white/10 rounded p-2 text-white">
                  <option>gemini-2.5-flash (System Default)</option>
                  <option>gemini-2.5-pro</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'ollama' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Endpoint Config */}
              <div>
                <label className="block text-xs font-mono text-white/60 uppercase mb-1">Ollama API Endpoint</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={settings.ollama.baseUrl}
                    onChange={(e) => updateOllamaSetting('baseUrl', e.target.value)}
                    className="flex-1 bg-black/40 border border-white/20 rounded p-2 text-sm text-white focus:border-orange-500 outline-none"
                    placeholder="http://localhost:11434"
                  />
                  <button 
                    onClick={() => fetchOllamaModels(settings.ollama.baseUrl)}
                    disabled={isFetchingModels}
                    className="px-4 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold uppercase border border-white/10"
                  >
                    {isFetchingModels ? "..." : "Refresh"}
                  </button>
                </div>
              </div>

              {/* Model Selector */}
              <div>
                 <label className="block text-xs font-mono text-white/60 uppercase mb-1">Select Model</label>
                 {fetchError ? (
                   <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-xs">
                     <strong>Connection Error:</strong> {fetchError}
                     <div className="mt-2 text-white/50">Ensure Ollama is running and CORS is enabled (see below).</div>
                   </div>
                 ) : (
                   <select 
                     value={settings.ollama.model}
                     onChange={(e) => updateOllamaSetting('model', e.target.value)}
                     className="w-full bg-black/40 border border-white/20 rounded p-2 text-sm text-white focus:border-orange-500 outline-none"
                   >
                     {ollamaModels.length === 0 && <option value="">No models detected (Click Refresh)</option>}
                     {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                 )}
              </div>

              {/* CORS Instruction */}
              <div className="p-4 bg-black/40 border border-white/10 rounded">
                <h3 className="text-xs font-bold text-orange-400 uppercase mb-2">Connection Requirements</h3>
                <p className="text-xs text-white/60 mb-3">
                  To allow the web app to connect to your local Ollama instance, you must run Ollama with CORS origins allowed.
                </p>
                <div className="relative group">
                  <div className="bg-black border border-white/10 p-3 rounded font-mono text-[10px] text-green-400 overflow-x-auto whitespace-nowrap">
                    $env:OLLAMA_ORIGINS="*"; ollama serve
                  </div>
                  <button 
                    onClick={copyPowerShellCmd}
                    className="absolute top-1 right-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-[9px] text-white rounded uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Copy (PowerShell)
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white uppercase">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase rounded shadow-lg shadow-cyan-900/50">
                Save Configuration
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
