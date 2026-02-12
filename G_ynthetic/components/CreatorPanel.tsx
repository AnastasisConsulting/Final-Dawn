// G_ynthetic/components/CreatorPanel.tsx
import React, { useState } from 'react';
import { ConfigAPI } from '../hooks/useConfig';

interface CreatorPanelProps {
    config: ConfigAPI;
}

export const CreatorPanel: React.FC<CreatorPanelProps> = ({ config }) => {
    const {
        creatorName, setCreatorName, creatorDesc, setCreatorDesc, 
        creatorPers, setCreatorPers, creatorScen, setCreatorScen, 
        creatorFirstMes, setCreatorFirstMes, creatorExample, setCreatorExample, 
        creatorAvatar, handleAvatarUpload, handleCardImport,
        handleExportCard, handleSaveToLibrary, handleUseCreatedCard,
        handleAiGeneration, isGeneratingCharacter
    } = config;

    const [aiPrompt, setAiPrompt] = useState("");

    return (
        <div className="space-y-4 w-full animate-fade-in p-4 h-full flex flex-col">
            <div className="p-4 border border-purple-900/30 bg-purple-900/10 rounded space-y-4 flex-shrink-0">
                <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Character Constructor</h3>
                    <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all border border-blue-400">
                        IMPORT JSON
                        <input type="file" accept=".json" onChange={handleCardImport} className="hidden" />
                    </label>
                </div>

                {/* AI GENERATOR INPUT */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="✨ Describe a character to auto-generate..." 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiGeneration(aiPrompt)}
                        className="flex-1 bg-black/50 border border-purple-500/30 p-2 text-xs text-white focus:border-purple-400 outline-none rounded"
                    />
                    <button 
                        onClick={() => handleAiGeneration(aiPrompt)}
                        disabled={isGeneratingCharacter || !aiPrompt}
                        className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded disabled:opacity-50 hover:bg-purple-500"
                    >
                        {isGeneratingCharacter ? 'GEN...' : 'AUTO-GEN'}
                    </button>
                </div>

                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <label className="block text-[10px] text-neutral-500 mb-1">AVATAR</label>
                        <div className="relative w-24 h-24 bg-black border border-neutral-700 hover:border-purple-500 cursor-pointer rounded overflow-hidden flex items-center justify-center group">
                            {creatorAvatar ? <img src={creatorAvatar} className="w-full h-full object-cover" /> : <span className="text-2xl text-neutral-600">+</span>}
                            <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e)} className="hidden" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <input type="text" placeholder="Name" value={creatorName} onChange={e => setCreatorName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-sm text-white focus:border-purple-500 outline-none" />
                        <textarea placeholder="Description" value={creatorDesc} onChange={e => setCreatorDesc(e.target.value)} rows={2} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                <textarea placeholder="Personality" value={creatorPers} onChange={e => setCreatorPers(e.target.value)} rows={3} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                <textarea placeholder="Scenario" value={creatorScen} onChange={e => setCreatorScen(e.target.value)} rows={3} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                <textarea placeholder="First Message" value={creatorFirstMes} onChange={e => setCreatorFirstMes(e.target.value)} rows={3} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none" />
                <textarea placeholder="Examples" value={creatorExample} onChange={e => setCreatorExample(e.target.value)} rows={4} className="w-full bg-neutral-900 border border-neutral-700 p-2 text-xs text-white focus:border-purple-500 outline-none resize-none font-mono" />
            </div>

            <div className="flex gap-2 pt-2 flex-shrink-0">
                <button onClick={handleExportCard} className="flex-1 py-2 bg-black border border-purple-700 text-purple-400 hover:text-white text-xs font-bold">⬇ EXPORT JSON</button>
                <button onClick={handleSaveToLibrary} className="flex-1 py-2 bg-green-900/30 border border-green-700 text-green-400 hover:text-white text-xs font-bold">💾 SAVE TO LIBRARY</button>
                <button onClick={handleUseCreatedCard} className="flex-1 py-2 bg-purple-800 text-white hover:bg-purple-700 text-xs font-bold">USE IN SIMULATION</button>
            </div>
        </div>
    );
};