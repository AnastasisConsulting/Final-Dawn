// components/ui/ControlPanel.tsx
import React, { useState, useEffect } from 'react';
import { PlanetState, GenerationStatus, TransformData, PhaseStatus, LogEntry } from '../../types';
import { validateWorldState } from '../../services/validation/worldValidator';
import { generateWorldZip } from '../../services/export/exportWorldBundle';
import { normalizePlanetStateIds } from '../../services/ids/idEnforcer';
import Terminal from './Terminal';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (val: string) => void;
  status: GenerationStatus;
  planetState: PlanetState;
  
  // Handlers
  handlePhase1: () => void;
  handlePhase2: (slotIndex: number) => void;
  handlePhase3: (slotIndex: number) => void;
  handleAutoGenerate: () => void;
  isAutoGenerating: boolean;

  handleSave: () => void;
  handleOpenLibrary: () => void;
  handleOpenSettings: () => void;
  onToggleOrbit: () => void; // New Handler
  
  phaseStatus: PhaseStatus;
  logs: LogEntry[];
  onChatSubmit: (message: string) => void;
  seedData: TransformData | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  prompt, setPrompt, status, planetState,
  handlePhase1, handlePhase2, handlePhase3, handleAutoGenerate, isAutoGenerating,
  handleSave, handleOpenLibrary, handleOpenSettings, onToggleOrbit,
  phaseStatus, logs, onChatSubmit, seedData
}) => {
  const [exportStatus, setExportStatus] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Busy status now includes auto-gen
  const isBusy = isAutoGenerating || (status !== GenerationStatus.IDLE && status !== GenerationStatus.SUCCESS && status !== GenerationStatus.ERROR);
  const worldId = planetState.ids?.node_key || "G1-S1-O1";

  useEffect(() => {
    const tempState = JSON.parse(JSON.stringify(planetState));
    const normalized = normalizePlanetStateIds(worldId, tempState);
    const result = validateWorldState(worldId, normalized, seedData?.Object_Key);
    setValidationErrors(result.errors);
  }, [planetState, worldId, seedData]);

  const handlePhase4Export = async () => {
    // We rely on validationErrors to block export, not phaseStatus flags
    if (validationErrors.length > 0) return;

    const tempState = JSON.parse(JSON.stringify(planetState));
    const normalized = normalizePlanetStateIds(worldId, tempState);
    const validation = validateWorldState(worldId, normalized, seedData?.Object_Key);
    
    if (!validation.ok) { setValidationErrors(validation.errors); return; }
    
    setExportStatus("Packaging...");
    try {
        const { blob, filename } = await generateWorldZip(worldId, normalized, seedData);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        setExportStatus("");
    } catch (e: any) {
        console.error("Export Failed", e);
        setExportStatus("Export Failed");
        setValidationErrors([e.message]);
    }
  };

  const isExportReady = validationErrors.length === 0;

  return (
    <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-hidden pr-2 pb-2 h-full relative">
      {/* Sticky Header Controls */}
      <div className="flex gap-2 shrink-0 sticky top-0 bg-black/80 backdrop-blur-md z-20 pb-2 border-b border-white/10">
        <button 
            disabled={isBusy}
            onClick={handleOpenLibrary} 
            className="flex-1 py-2 bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 text-xs font-bold rounded text-white uppercase flex items-center justify-center gap-2 border border-white/10 shadow-lg"
            title="Open World Library"
        >
            <span>📂</span> Library
        </button>
        <button 
            disabled={isBusy}
            onClick={handleSave} 
            className="flex-1 py-2 bg-gradient-to-b from-cyan-800 to-cyan-900 hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 text-xs font-bold text-cyan-100 rounded border border-cyan-500/30 uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
            title="Save current workspace to .GEN file"
        >
            <span>💾</span> Save
        </button>
        <button 
            onClick={onToggleOrbit}
            className={`px-3 py-2 rounded border flex items-center justify-center transition-all ${planetState.isCinematic ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-white/10 text-white/50 border-white/10 hover:text-white'}`}
            title="Toggle Cinematic Orbit (Spaceship View)"
        >
            🪐
        </button>
        <button 
            disabled={isBusy}
            onClick={handleOpenSettings} 
            className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded border border-white/10 flex items-center justify-center" 
            title="System Settings"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          <div className="space-y-2 shrink-0">
            <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-mono text-white/40 uppercase">World Designation</label>
                {seedData && <div className="text-[9px] text-green-400 font-mono bg-green-900/20 px-1 rounded">SEED: {seedData.Object_Name}</div>}
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} 
                className="w-full h-20 bg-black/40 border border-white/20 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none resize-none placeholder-white/20" 
                placeholder="Enter planet designation and themes..."
                disabled={isBusy}
            />
          </div>

          <hr className="border-white/10 shrink-0" />

          {/* AUTO GEN BUTTON */}
          <div className="shrink-0">
             <button 
                onClick={handleAutoGenerate}
                disabled={isBusy || isExportReady}
                className={`w-full py-2.5 rounded border text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2
                    ${isBusy 
                        ? 'bg-amber-900/20 border-amber-500/20 text-amber-500 animate-pulse' 
                        : isExportReady 
                            ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-900 to-indigo-900 border-purple-500/50 hover:from-purple-800 hover:to-indigo-800 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'}`}
             >
                {isBusy ? (
                    <>
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                        PROCESSING SEQUENCE...
                    </>
                ) : isExportReady ? (
                    "SEQUENCE COMPLETE"
                ) : (
                    <>
                        <span>⚡</span> AUTO-GENERATE FULL SEQUENCE
                    </>
                )}
             </button>
             <p className="text-[9px] text-white/30 text-center mt-1 font-mono">
                {isBusy ? "PLEASE WAIT. DO NOT CLOSE WINDOW." : "Execute all remaining phases sequentially."}
             </p>
          </div>

          <hr className="border-white/10 shrink-0" />

          {/* PHASE CONTROLS */}
          <div className={`space-y-4 shrink-0 transition-opacity duration-300 ${isBusy ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className={`p-2 rounded border ${phaseStatus.phase1Done ? 'bg-green-900/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-white">PHASE 1: VISUALS</span></div>
                <button onClick={handlePhase1} disabled={isBusy} className="w-full py-2 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white border border-white/10 disabled:opacity-50 transition-colors">
                    {status === GenerationStatus.GENERATING_VISUALS ? 'SCANNING...' : phaseStatus.phase1Done ? 'RE-GENERATE VISUALS' : 'INITIATE ORBITAL SCAN'}
                </button>
            </div>
            
            <div className="space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase flex justify-between">
                    <span>PHASE 2: CIVILIZATION LORE</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map(i => (
                        <button key={i} disabled={isBusy || !phaseStatus.phase1Done} onClick={() => handlePhase2(i + 1)}
                            className={`py-2 rounded border text-[10px] font-bold transition-all ${phaseStatus.civ2Done[i] ? 'bg-purple-900/30 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                            {status === GenerationStatus.GENERATING_LORE ? '...' : `CIV ${i+1}`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">PHASE 3: POPULATION & QUESTS</div>
                <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map(i => (
                        <button key={i} disabled={isBusy || !phaseStatus.civ2Done[i]} onClick={() => handlePhase3(i + 1)}
                            className={`py-2 rounded border text-[10px] font-bold transition-all ${phaseStatus.civ3Done[i] ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                            {status === GenerationStatus.GENERATING_NPCS ? '...' : `CIV ${i+1}`}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <hr className="border-white/10 shrink-0" />
          
          <div className="flex-1 min-h-[150px] flex flex-col">
             <Terminal logs={logs} isBusy={isBusy} onChatSubmit={onChatSubmit} />
          </div>
          
          <button 
            onClick={handlePhase4Export} 
            disabled={!isExportReady || isBusy}
            className={`shrink-0 w-full py-3 text-white font-bold rounded border tracking-widest mt-2 transition-all
                ${!isExportReady || isBusy 
                    ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-500 border-green-400 shadow-[0_0_15px_rgba(22,163,74,0.5)]'}`}
          >
            {exportStatus || (isExportReady ? "EXPORT FINAL WORLD BUNDLE" : "FINISH GENERATION TO EXPORT")}
          </button>
          
          {!isExportReady && validationErrors.length > 0 && (
             <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
                <div className="text-[9px] text-red-400 font-bold mb-1">MISSING DATA:</div>
                <div className="text-[8px] text-red-300 font-mono space-y-0.5">
                    {validationErrors.slice(0,3).map((err, i) => <div key={i}>• {err}</div>)}
                    {validationErrors.length > 3 && <div>...and {validationErrors.length - 3} more</div>}
                </div>
             </div>
          )}
      </div>
    </div>
  );
};
export default ControlPanel;