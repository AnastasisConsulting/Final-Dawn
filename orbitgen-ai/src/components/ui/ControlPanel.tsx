// PATH: src/components/ui/ControlPanel.tsx
import React, { useState, useEffect } from 'react';
import { PlanetState, GenerationStatus, TransformData, PhaseStatus } from '../../types';
import { validateWorldState } from '../../services/validation/worldValidator';
import { generateWorldZip } from '../../services/export/exportWorldBundle';
import { normalizePlanetStateIds } from '../../services/ids/idEnforcer';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (val: string) => void;
  status: GenerationStatus;
  planetState: PlanetState;
  setPlanetState: React.Dispatch<React.SetStateAction<PlanetState>>;
  
  handlePhase1: () => void;
  handlePhase2: (slotIndex: number) => void;
  handlePhase3: (slotIndex: number) => void;
  
  handleSave: () => void;
  handleOpenLibrary: () => void;
  
  phaseStatus: PhaseStatus;
  
  // Legacy/Helpers
  handleExport: () => void; 
  seedData: TransformData | null;
  setSeedData: React.Dispatch<React.SetStateAction<TransformData | null>>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  prompt,
  setPrompt,
  status,
  planetState,
  handlePhase1,
  handlePhase2,
  handlePhase3,
  handleSave,
  handleOpenLibrary,
  phaseStatus,
  seedData
}) => {
  
  const [exportStatus, setExportStatus] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const isBusy = status !== GenerationStatus.IDLE && status !== GenerationStatus.SUCCESS && status !== GenerationStatus.ERROR;

  const worldId = planetState.ids?.node_key || "G1-S1-O1";

  // Real-time Validation
  useEffect(() => {
    // We normalize a copy just for validation check, to show accurate errors
    // Note: We avoid mutation here.
    const tempState = JSON.parse(JSON.stringify(planetState));
    const normalized = normalizePlanetStateIds(worldId, tempState);
    const result = validateWorldState(worldId, normalized);
    setValidationErrors(result.errors);
  }, [planetState, worldId]);

  const handlePhase4Export = async () => {
    // Double check normalization + validation
    const tempState = JSON.parse(JSON.stringify(planetState));
    const normalized = normalizePlanetStateIds(worldId, tempState);
    const validation = validateWorldState(worldId, normalized);

    if (!validation.ok) {
        setValidationErrors(validation.errors);
        return;
    }
    
    setExportStatus("Packaging...");

    try {
        const { blob, filename } = await generateWorldZip(worldId, normalized, seedData);
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setExportStatus("");
    } catch (e: any) {
        console.error("Export Failed", e);
        setExportStatus("Export Failed");
        setValidationErrors([e.message]);
    }
  };

  return (
    <div className="w-full md:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
      
      {/* Top Controls */}
      <div className="flex gap-2 mb-2">
        <button onClick={handleOpenLibrary} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded">LIBRARY</button>
        <button onClick={handleSave} className="flex-1 py-2 bg-cyan-900/50 hover:bg-cyan-800/50 text-xs font-bold text-cyan-200 rounded border border-cyan-500/30">SAVE WORKSPACE</button>
      </div>

      {/* Main Input */}
      <div className="space-y-2">
         <label className="text-[10px] font-mono text-white/40 uppercase">World Description</label>
         <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            className="w-full h-20 bg-black/40 border border-white/20 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none resize-none" 
            placeholder="Describe the world..."
         />
         {seedData && <div className="text-[10px] text-green-400 font-mono">Linked Seed: {seedData.Object_Name}</div>}
      </div>

      <hr className="border-white/10" />

      {/* MISSION CONTROL: PHASES */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Generation Phases</h3>
        
        {/* Phase 1 */}
        <div className={`p-3 rounded border ${phaseStatus.phase1Done ? 'bg-green-900/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-white">PHASE 1: VISUALS</span>
                {phaseStatus.phase1Done && <span className="text-[10px] text-green-400">COMPLETE</span>}
            </div>
            <button 
                onClick={handlePhase1}
                disabled={isBusy}
                className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white border border-white/10 disabled:opacity-50"
            >
                {status === GenerationStatus.GENERATING_VISUALS ? 'SCANNING...' : phaseStatus.phase1Done ? 'RE-GENERATE VISUALS' : 'INITIATE ORBITAL SCAN'}
            </button>
        </div>

        {/* Phase 2: Civ Lore */}
        <div className="space-y-2">
             <div className="text-[10px] font-mono text-white/40 uppercase">PHASE 2: CIVILIZATION LORE</div>
             <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => (
                    <button 
                        key={i}
                        disabled={isBusy || !phaseStatus.phase1Done}
                        onClick={() => handlePhase2(i + 1)}
                        className={`py-2 rounded border text-[10px] font-bold 
                            ${phaseStatus.civ2Done[i] 
                                ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                    >
                        {status === GenerationStatus.GENERATING_LORE ? '...' : `CIV ${i+1}`}
                    </button>
                ))}
             </div>
        </div>

        {/* Phase 3: NPCs */}
        <div className="space-y-2">
             <div className="text-[10px] font-mono text-white/40 uppercase">PHASE 3: POPULATION & QUESTS</div>
             <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => (
                    <button 
                        key={i}
                        disabled={isBusy || !phaseStatus.civ2Done[i]}
                        onClick={() => handlePhase3(i + 1)}
                        className={`py-2 rounded border text-[10px] font-bold 
                            ${phaseStatus.civ3Done[i] 
                                ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-200' 
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                    >
                        {status === GenerationStatus.GENERATING_NPCS ? '...' : `CIV ${i+1}`}
                    </button>
                ))}
             </div>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Validation & Export */}
      <div>
        <h3 className="text-xs font-mono text-red-400 uppercase tracking-widest mb-2">System Validation</h3>
        <div className="bg-black/40 border border-white/10 rounded p-2 h-32 overflow-y-auto custom-scrollbar mb-4">
            {validationErrors.length === 0 ? (
                <div className="text-green-500 text-[10px] font-mono">ALL SYSTEMS NOMINAL. READY FOR EXPORT.</div>
            ) : (
                <ul className="space-y-1">
                    {validationErrors.map((err, i) => (
                        <li key={i} className="text-red-400 text-[10px] font-mono">• {err}</li>
                    ))}
                </ul>
            )}
        </div>
        
        <button 
            onClick={handlePhase4Export}
            disabled={validationErrors.length > 0 || isBusy}
            className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:bg-black/50 disabled:text-white/20 text-white font-bold rounded border border-white/10 tracking-widest"
        >
            {exportStatus || "EXPORT WORLD BUNDLE"}
        </button>
      </div>

    </div>
  );
};

export default ControlPanel;
