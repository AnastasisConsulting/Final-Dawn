import React, { useState } from 'react';
import { Character, Lorebook, GenerationSettings, PromptOrder, SystemPromptTemplate } from '../types';
import { getPromptPreview } from '../services/geminiService';

interface ConfigPanelProps {
  character: Character;
  onUpdateCharacter: (char: Character) => void;
  lorebook: Lorebook;
  onUpdateLorebook: (lore: Lorebook) => void;
  settings: GenerationSettings;
  onUpdateSettings: (settings: GenerationSettings) => void;
  systemPrompts: SystemPromptTemplate[];
  onSaveSystemPrompt: (name: string, content: string) => void;
  onRefreshOllama: () => void;
  ollamaModels: string[];
  previewPayload: any;
  onResetStorage?: () => void;
}

type Tab = 'character' | 'lorebook' | 'settings' | 'debug';

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  character,
  onUpdateCharacter,
  lorebook,
  onUpdateLorebook,
  settings,
  onUpdateSettings,
  systemPrompts,
  onSaveSystemPrompt,
  onRefreshOllama,
  ollamaModels,
  previewPayload,
  onResetStorage
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('character');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');

  const handleCharChange = (field: keyof Character, value: string) => {
    onUpdateCharacter({ ...character, [field]: value });
  };

  const handleLoadPreset = (id: string) => {
    const preset = systemPrompts.find(p => p.id === id);
    if (preset) {
        handleCharChange('systemPrompt', preset.content);
    }
  };

  const handleSaveCurrentPrompt = () => {
    if (!newPromptName.trim()) return;
    onSaveSystemPrompt(newPromptName, character.systemPrompt);
    setShowSavePrompt(false);
    setNewPromptName('');
  };

  const addLoreEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      keywords: ['new_keyword'],
      content: 'New lore entry content...',
      enabled: true
    };
    onUpdateLorebook({
      ...lorebook,
      entries: [...lorebook.entries, newEntry]
    });
  };

  const updateLoreEntry = (id: string, field: 'keywords' | 'content', value: string) => {
    const updatedEntries = lorebook.entries.map(e => {
      if (e.id === id) {
        return field === 'keywords' 
          ? { ...e, keywords: value.split(',').map(k => k.trim()) }
          : { ...e, content: value };
      }
      return e;
    });
    onUpdateLorebook({ ...lorebook, entries: updatedEntries });
  };

  const toggleLoreEntry = (id: string) => {
    const updatedEntries = lorebook.entries.map(e => 
      e.id === id ? { ...e, enabled: !e.enabled } : e
    );
    onUpdateLorebook({ ...lorebook, entries: updatedEntries });
  };

  const movePromptItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...settings.promptOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    onUpdateSettings({ ...settings, promptOrder: newOrder });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-80 md:w-96 shrink-0 shadow-xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-950">
        {(['character', 'lorebook', 'settings', 'debug'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors ${
              activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* CHARACTER TAB */}
        {activeTab === 'character' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Character Card (V2 Style)</h3>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Name</label>
              <input 
                type="text" 
                value={character.name}
                onChange={(e) => handleCharChange('name', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Description</label>
              <textarea 
                value={character.description}
                onChange={(e) => handleCharChange('description', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none h-20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Personality</label>
              <textarea 
                value={character.personality}
                onChange={(e) => handleCharChange('personality', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none h-16"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Scenario</label>
              <textarea 
                value={character.scenario}
                onChange={(e) => handleCharChange('scenario', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none h-20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">First Message</label>
              <textarea 
                value={character.firstMessage}
                onChange={(e) => handleCharChange('firstMessage', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none h-20"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800">
               <div className="flex justify-between items-end">
                   <label className="text-xs text-blue-400 font-semibold">System Instruction Override</label>
                   {!showSavePrompt ? (
                       <button onClick={() => setShowSavePrompt(true)} className="text-[10px] text-gray-400 hover:text-white underline">
                           Save Preset
                       </button>
                   ) : (
                       <div className="flex gap-1 items-center">
                           <input 
                             type="text" 
                             className="bg-gray-800 border border-gray-600 rounded px-1 text-[10px] w-24"
                             placeholder="Name..."
                             value={newPromptName}
                             onChange={(e) => setNewPromptName(e.target.value)}
                           />
                           <button onClick={handleSaveCurrentPrompt} className="text-[10px] bg-blue-600 text-white px-1 rounded">✓</button>
                           <button onClick={() => setShowSavePrompt(false)} className="text-[10px] text-gray-400">✕</button>
                       </div>
                   )}
               </div>
               
               <select 
                 className="w-full bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1 mb-1"
                 onChange={(e) => {
                     if(e.target.value) handleLoadPreset(e.target.value);
                 }}
                 value=""
               >
                   <option value="" disabled>Load a System Preset...</option>
                   {systemPrompts.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
               </select>

              <textarea 
                value={character.systemPrompt}
                onChange={(e) => handleCharChange('systemPrompt', e.target.value)}
                className="w-full bg-gray-800 border border-blue-900/50 rounded px-2 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none h-24 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* LOREBOOK TAB */}
        {activeTab === 'lorebook' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h3 className="text-sm font-semibold text-gray-300">World Info / Lorebook</h3>
                <button onClick={addLoreEntry} className="text-xs bg-green-700 px-2 py-1 rounded text-white hover:bg-green-600">
                  + Add Entry
                </button>
            </div>

            <div className="space-y-4">
              {lorebook.entries.map((entry) => (
                <div key={entry.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-gray-500">Keywords (comma sep)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{entry.enabled ? 'ON' : 'OFF'}</span>
                      <button 
                        onClick={() => toggleLoreEntry(entry.id)}
                        className={`w-3 h-3 rounded-full ${entry.enabled ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </div>
                  <input 
                    type="text"
                    value={entry.keywords.join(', ')}
                    onChange={(e) => updateLoreEntry(entry.id, 'keywords', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 mb-2"
                  />
                  <label className="text-xs text-gray-500 block mb-1">Content</label>
                  <textarea 
                    value={entry.content}
                    onChange={(e) => updateLoreEntry(entry.id, 'content', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 h-16"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Generation Settings</h3>
            
            {/* Provider Selector */}
            <div className="bg-gray-800 p-3 rounded border border-gray-700 space-y-3">
              <label className="text-xs text-gray-400 font-bold uppercase">Backend Provider</label>
              <div className="flex gap-2">
                 <button 
                   onClick={() => onUpdateSettings({...settings, provider: 'gemini'})}
                   className={`flex-1 py-2 text-xs rounded font-bold border ${settings.provider === 'gemini' ? 'bg-blue-900/50 border-blue-500 text-blue-100' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                 >
                   Gemini API
                 </button>
                 <button 
                   onClick={() => onUpdateSettings({...settings, provider: 'ollama'})}
                   className={`flex-1 py-2 text-xs rounded font-bold border ${settings.provider === 'ollama' ? 'bg-orange-900/50 border-orange-500 text-orange-100' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                 >
                   Ollama (Local)
                 </button>
              </div>

              {settings.provider === 'ollama' && (
                <div className="space-y-2 pt-2 border-t border-gray-700">
                   <div className="space-y-1">
                      <label className="text-xs text-gray-500">Ollama URL</label>
                      <input 
                        type="text" 
                        value={settings.ollamaUrl} 
                        onChange={(e) => onUpdateSettings({...settings, ollamaUrl: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                      />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] text-gray-500">Models: {ollamaModels.length} found</span>
                     <button onClick={onRefreshOllama} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Refresh</button>
                   </div>
                   
                   {/* CORS Help Snippet */}
                   <div className="mt-4 bg-gray-950 rounded p-2 border border-orange-900/30">
                     <p className="text-[10px] text-orange-400 mb-1 font-bold">⚠️ Connection Issue?</p>
                     <p className="text-[10px] text-gray-400 mb-2">
                       If Ollama is running but not connecting, you likely need to allow CORS. Run this in PowerShell:
                     </p>
                     <div className="flex items-start gap-2 bg-black rounded p-1 border border-gray-800">
                        <code className="text-[9px] font-mono text-green-500 break-all">
                        $env:OLLAMA_ORIGINS="*"; ollama serve
                        </code>
                        <button 
                          onClick={() => copyToClipboard('$env:OLLAMA_ORIGINS="*"; ollama serve')}
                          className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-1 py-0.5 rounded"
                          title="Copy"
                        >
                          📋
                        </button>
                     </div>
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-bold">Model Selection</label>
              <select 
                value={settings.model}
                onChange={(e) => onUpdateSettings({...settings, model: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm text-white"
              >
                {settings.provider === 'gemini' ? (
                  <>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
                    <option value="gemini-flash-lite-latest">Gemini Flash Lite</option>
                  </>
                ) : (
                  <>
                     {ollamaModels.length === 0 && <option value="" disabled>No local models found</option>}
                     {ollamaModels.map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Temperature</span> <span>{settings.temperature}</span>
              </label>
              <input 
                type="range" min="0" max="2" step="0.1"
                value={settings.temperature}
                onChange={(e) => onUpdateSettings({...settings, temperature: parseFloat(e.target.value)})}
                className="w-full accent-blue-500"
              />
            </div>

            {settings.provider === 'gemini' && (
              <div className="space-y-2">
                <label className="text-xs text-gray-500 flex justify-between">
                  <span>Thinking Budget (Tokens)</span> <span>{settings.thinkingBudget}</span>
                </label>
                <input 
                  type="range" min="0" max="8192" step="128"
                  value={settings.thinkingBudget}
                  onChange={(e) => onUpdateSettings({...settings, thinkingBudget: parseInt(e.target.value)})}
                  className="w-full accent-purple-500"
                />
                <p className="text-[10px] text-gray-500">Set {'>'} 0 to enable Thinking (2.5 models only)</p>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-gray-700">
               <h4 className="text-xs font-bold text-gray-400 uppercase">Prompt Construction Order</h4>
               <p className="text-[10px] text-gray-500">Drag/Click arrows to prioritize instructions sent to the model.</p>
               <div className="space-y-1">
                 {settings.promptOrder.map((item, idx) => (
                   <div key={item} className="flex items-center justify-between bg-gray-800 p-2 rounded text-xs">
                      <span>{item}</span>
                      <div className="flex gap-1">
                        <button onClick={() => movePromptItem(idx, 'up')} className="hover:text-blue-400 p-1">↑</button>
                        <button onClick={() => movePromptItem(idx, 'down')} className="hover:text-blue-400 p-1">↓</button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="pt-8 mt-8 border-t border-red-900/30">
                <button 
                  onClick={onResetStorage}
                  className="w-full border border-red-900 text-red-700 hover:bg-red-900/20 text-xs py-2 rounded"
                >
                    Reset All Data & Clear Storage
                </button>
            </div>
          </div>
        )}

        {/* DEBUG TAB */}
        {activeTab === 'debug' && (
           <div className="space-y-2 h-full flex flex-col">
             <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Prompt Inspector</h3>
             <p className="text-[10px] text-gray-500">This is what will be sent to the API on the next message.</p>
             <textarea 
               readOnly
               value={getPromptPreview(previewPayload)}
               className="w-full flex-1 bg-black border border-gray-800 text-green-500 font-mono text-[10px] p-2 rounded resize-none"
             />
           </div>
        )}

      </div>
    </div>
  );
};

export default ConfigPanel;