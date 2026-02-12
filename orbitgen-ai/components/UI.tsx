// components/UI.tsx
import React, { useState } from 'react';
import { PlanetState, GenerationStatus, TransformData, PhaseStatus, Workspace, LogEntry, Leader, Governor, Lieutenant } from '../types';
import { loadWorkspace } from '../services/storageService';
import { createWorkspaceGenFile, parseWorkspaceGenFile } from '../services/export/workspaceSaver';
import { validateWorldIdFormat } from '../services/ids/idValidator';
import ControlPanel from './ui/ControlPanel';
import DataFeed from './ui/DataFeed';
import GenerationMonitor from './ui/GenerationMonitor'; 
import LibraryModal from './ui/LibraryModal';
import SettingsModal from './ui/SettingsModal';
import AvatarGeneratorModal from './ui/AvatarGeneratorModal';
import BatchAvatarModal from './ui/BatchAvatarModal'; // New Import
import { useWorldGeneration } from '../hooks/useWorldGeneration';

interface UIProps {
  planetState: PlanetState;
  setPlanetState: React.Dispatch<React.SetStateAction<PlanetState>>;
}

const UI: React.FC<UIProps> = ({ planetState, setPlanetState }) => {
  const [prompt, setPrompt] = useState('Designation: P-901');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [seedData, setSeedData] = useState<TransformData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus>({
    phase1Done: false, civ2Done: [false, false, false], civ3Done: [false, false, false]
  });

  // Avatar Modal State
  const [avatarTarget, setAvatarTarget] = useState<{ id: string; name: string; description: string; role: string; avatarUrl?: string } | null>(null);
  // Batch Avatar Modal State
  const [batchTarget, setBatchTarget] = useState<{ targets: { id: string; name: string; description: string; role: string }[], contextName: string } | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
      setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), type, message }]);
  };

  const ensureWorldId = (forcedId?: string) => {
     if (forcedId) return forcedId;
     if (planetState.ids?.node_key) return planetState.ids.node_key;
     const g = Math.floor(Math.random()*3)+1; const s = Math.floor(Math.random()*3)+1; const o = Math.floor(Math.random()*7)+1;
     const newId = `G${g}-S${s}-O${o}`;
     setPlanetState(prev => ({ ...prev, ids: { planet_id: newId, node_key: newId, galaxy: g, system: s, object: o } }));
     return newId;
  };

  const { handlePhase1, handlePhase2, handlePhase3, handleAutoGenerate, isAutoGenerating, activePhaseContext } = useWorldGeneration({
      planetState, setPlanetState, prompt, seedData, setPhaseStatus, setStatus, addLog, ensureWorldId
  });

  const handleSave = async () => {
    const worldId = ensureWorldId(seedData?.Object_Key);
    const workspace: Workspace = {
        worldId, seedData, lastModified: Date.now(), phaseStatus,
        planetState: { ...planetState, ids: { ...planetState.ids!, node_key: worldId } }
    };
    try {
        addLog(`Packaging ${worldId}.gen ...`, 'info');
        const { blob, filename } = await createWorkspaceGenFile(workspace);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        addLog(`Saved to ${filename}`, 'success');
    } catch (e: any) { addLog(`Save Failed: ${e.message}`, 'error'); }
  };

  const handleImportGen = (file: File) => {
      addLog(`Reading ${file.name}...`, 'info');
      parseWorkspaceGenFile(file).then(workspace => {
            setPlanetState(workspace.planetState); setPhaseStatus(workspace.phaseStatus);
            setSeedData(workspace.seedData); setPrompt(workspace.planetState.name);
            setStatus(GenerationStatus.SUCCESS); addLog(`Loaded workspace ${workspace.worldId}.`, 'success');
      }).catch(err => { console.error(err); addLog(`Failed to load .gen: ${err.message}`, 'error'); });
  };

  const handleLoad = async (worldId: string) => {
    addLog(`Loading workspace ${worldId}...`, 'info');
    const workspace = await loadWorkspace(worldId);
    if (workspace) {
        setPlanetState(workspace.planetState); setPhaseStatus(workspace.phaseStatus);
        setSeedData(workspace.seedData); setPrompt(workspace.planetState.name);
        setStatus(GenerationStatus.SUCCESS); addLog("Workspace loaded.", 'success');
    } else { addLog("Workspace not found.", 'error'); }
  };

  const handleNew = (seedImport?: TransformData) => {
    let initialIds = undefined;
    if (seedImport) {
        const key = seedImport.Object_Key; const [_, g, s, o] = key.match(/^G(\d+)-S(\d+)-O(\d+)$/) || [];
        initialIds = { planet_id: key, node_key: key, galaxy: parseInt(g) || 1, system: parseInt(s) || 1, object: parseInt(o) || 1 };
    }
    setPlanetState({ textureUrl: null, name: seedImport?.Object_Name || 'New World', description: 'Unexplored.', atmosphereColor: '#4488ff', rotationSpeed: 0.2, ids: initialIds, isCinematic: true });
    setPhaseStatus({ phase1Done: false, civ2Done: [false, false, false], civ3Done: [false, false, false] });
    setSeedData(seedImport || null); setPrompt(seedImport?.Object_Name || 'New World');
    setStatus(GenerationStatus.IDLE); setLogs([]); addLog("System Initialized.", 'info');
    if (!seedImport) ensureWorldId(); 
  };

  const handleSeedUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            if (!validateWorldIdFormat(json.Object_Key).valid) { addLog(`Seed Rejected`, 'error'); return; }
            handleNew(json); addLog(`Seed Loaded: ${json.Object_Name}`, 'success');
        } catch (err) { addLog("Invalid Seed JSON", 'error'); }
    };
    reader.readAsText(file);
  };

  const handleChatRefinement = async (message: string) => {
      addLog(message, 'user');
      if (!activePhaseContext) { addLog("No active generation phase to refine.", 'error'); return; }
      if (activePhaseContext.phase === 1) { addLog("Refining Visuals...", 'ai'); await handlePhase1(message); }
      else if (activePhaseContext.phase === 2 && activePhaseContext.slotIndex) { addLog(`Refining Civ ${activePhaseContext.slotIndex}...`, 'ai'); await handlePhase2(activePhaseContext.slotIndex, message); }
      else if (activePhaseContext.phase === 3 && activePhaseContext.slotIndex) { addLog(`Refining NPCs...`, 'ai'); await handlePhase3(activePhaseContext.slotIndex, message); }
  };

  // Avatar Handlers
  const handleOpenAvatarStudio = (npc: { id: string; name: string; description: string; role: string; avatarUrl?: string }) => {
    setAvatarTarget(npc);
  };

  const handleOpenBatchAvatarStudio = (targets: { id: string; name: string; description: string; role: string }[], contextName: string) => {
    setBatchTarget({ targets, contextName });
  };

  const handleSaveAvatar = (npcId: string, avatarUrl: string) => {
    handleBatchSaveAvatars({ [npcId]: avatarUrl });
  };

  const handleBatchSaveAvatars = (updates: Record<string, string>) => {
    setPlanetState(prev => {
        const newState = { ...prev };
        newState.metadata?.civilizations.forEach(civ => {
            if (civ.leader && updates[civ.leader.id]) {
                civ.leader.avatarUrl = updates[civ.leader.id];
            }
            civ.cities.forEach(city => {
                if (city.governor) {
                    if (updates[city.governor.id]) city.governor.avatarUrl = updates[city.governor.id];
                    city.governor.lieutenants.forEach(lt => {
                        if (updates[lt.id]) lt.avatarUrl = updates[lt.id];
                    });
                }
            });
        });
        return newState;
    });
    addLog(`Avatars updated for ${Object.keys(updates).length} entities.`, 'success');
  };

  const isGenerating = status === GenerationStatus.GENERATING_VISUALS || 
                       status === GenerationStatus.GENERATING_LORE || 
                       status === GenerationStatus.GENERATING_NPCS;

  const toggleOrbit = () => {
    setPlanetState(prev => ({ ...prev, isCinematic: !prev.isCinematic }));
  };

  return (
    <>
    {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} onLoad={handleLoad} onNew={() => handleNew()} onUploadSeed={handleSeedUpload} onImportGen={handleImportGen} />}
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    
    {avatarTarget && (
        <AvatarGeneratorModal 
            npc={avatarTarget} 
            onClose={() => setAvatarTarget(null)} 
            onSave={handleSaveAvatar} 
        />
    )}

    {batchTarget && (
        <BatchAvatarModal 
            targets={batchTarget.targets}
            contextName={batchTarget.contextName}
            onClose={() => setBatchTarget(null)}
            onSave={handleBatchSaveAvatars}
        />
    )}

    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 z-10">
      <div className="flex justify-between items-start">
        <div className="bg-black/50 backdrop-blur-md border border-white/10 p-4 rounded-lg pointer-events-auto shadow-lg shadow-cyan-900/20">
          <h1 className="text-2xl font-bold tracking-widest uppercase text-cyan-400">OrbitGen AI</h1>
          <p className="text-xs text-white/60 font-mono">STATUS: {status === GenerationStatus.SUCCESS ? 'ONLINE' : isGenerating ? 'GENERATING...' : 'READY'}</p>
        </div>
        <div className="pointer-events-auto">
             <button onClick={() => setIsExpanded(!isExpanded)} className="bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-lg text-cyan-400 font-bold hover:bg-black/70">{isExpanded ? 'HIDE' : 'MENU'}</button>
        </div>
      </div>
      {isExpanded && (
        <div className="self-center w-full max-w-[90rem] pointer-events-auto animate-in fade-in duration-500 h-[85vh]">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-cyan-900/20 h-full flex flex-col md:flex-row gap-6">
            <ControlPanel 
              prompt={prompt} 
              setPrompt={setPrompt} 
              status={status} 
              planetState={planetState} 
              handlePhase1={() => handlePhase1()} 
              handlePhase2={(s) => handlePhase2(s)} 
              handlePhase3={(s) => handlePhase3(s)}
              handleAutoGenerate={() => handleAutoGenerate(phaseStatus)}
              isAutoGenerating={isAutoGenerating}
              handleSave={handleSave} 
              handleOpenLibrary={() => setShowLibrary(true)} 
              handleOpenSettings={() => setShowSettings(true)}
              onToggleOrbit={toggleOrbit}
              phaseStatus={phaseStatus} 
              logs={logs}
              onChatSubmit={handleChatRefinement}
              seedData={seedData} 
            />
            
            {isGenerating ? (
                <GenerationMonitor logs={logs} status={status} />
            ) : (
                <DataFeed 
                    metadata={planetState.metadata} 
                    onOpenAvatarStudio={handleOpenAvatarStudio} 
                    onOpenBatchAvatarStudio={handleOpenBatchAvatarStudio}
                />
            )}
            
          </div>
        </div>
      )}
    </div>
    <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }`}</style>
    </>
  );
};
export default UI;