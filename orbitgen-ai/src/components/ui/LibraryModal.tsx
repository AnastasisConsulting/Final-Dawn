// PATH: src/components/ui/LibraryModal.tsx
import React, { useEffect, useState } from 'react';
import { listWorkspaces, deleteWorkspace, loadWorkspace } from '../../services/storageService';
import { LibraryEntry } from '../../types';
import { generateWorldZip } from '../../services/export/exportWorldBundle';
import { validateWorldState } from '../../services/validation/worldValidator';
import { normalizePlanetStateIds } from '../../services/ids/idEnforcer';

interface LibraryModalProps {
  onLoad: (worldId: string) => void;
  onClose: () => void;
  onNew: () => void;
  onUploadSeed: (file: File) => void;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ onLoad, onClose, onNew, onUploadSeed }) => {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [seedFile, setSeedFile] = useState<File | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const refreshLib = async () => {
    const list = await listWorkspaces();
    setEntries(list);
  };

  useEffect(() => { refreshLib(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this world permanently?")) {
        await deleteWorkspace(id);
        refreshLib();
    }
  };

  const handleExportEntry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExportingId(id);
    try {
        const workspace = await loadWorkspace(id);
        if (!workspace) throw new Error("Could not load workspace.");

        // Normalize & Validate
        const normalized = normalizePlanetStateIds(id, workspace.planetState);
        const validation = validateWorldState(id, normalized);

        if (!validation.ok) {
            alert(`Export Blocked:\n${validation.errors.join('\n')}`);
            setExportingId(null);
            return;
        }

        const { blob, filename } = await generateWorldZip(id, normalized, workspace.seedData);
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err: any) {
        console.error(err);
        alert(`Export Failed: ${err.message}`);
    } finally {
        setExportingId(null);
    }
  };

  const handleSeedSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setSeedFile(e.target.files[0]);
    }
  };

  const startNew = () => {
    if (seedFile) {
        onUploadSeed(seedFile);
    } else {
        onNew();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">Planetary Archive</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* New World Section */}
            <div className="mb-8 p-4 bg-white/5 rounded border border-dashed border-white/20">
                <h3 className="text-sm font-bold text-white mb-2">Initialize New Sequence</h3>
                <div className="flex gap-4 items-center">
                    <input type="file" onChange={handleSeedSelect} accept=".json" className="text-xs text-white/60" />
                    <button onClick={startNew} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold uppercase">
                        {seedFile ? "Initialize with Seed" : "Initialize Empty"}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                <h3 className="text-xs text-white/40 uppercase font-mono mb-2">Stored Workspaces</h3>
                {entries.length === 0 && <p className="text-white/20 italic text-sm">No archives found.</p>}
                {entries.map(entry => (
                    <div key={entry.worldId} onClick={() => { onLoad(entry.worldId); onClose(); }} 
                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded cursor-pointer flex justify-between items-center group transition-all">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{entry.name || "Untitled World"}</span>
                                <span className="text-[10px] font-mono text-cyan-500 bg-cyan-900/30 px-1 rounded">{entry.worldId}</span>
                            </div>
                            <div className="text-[10px] text-white/40 mt-1">
                                Last Modified: {new Date(entry.lastModified).toLocaleString()}
                            </div>
                            {/* Mini Progress Bar */}
                            <div className="flex gap-1 mt-2">
                                <div className={`h-1 w-6 rounded ${entry.phaseStatus.phase1Done ? 'bg-cyan-500' : 'bg-gray-700'}`}></div>
                                <div className={`h-1 w-6 rounded ${entry.phaseStatus.civ2Done[0] ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                                <div className={`h-1 w-6 rounded ${entry.phaseStatus.civ2Done[1] ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                                <div className={`h-1 w-6 rounded ${entry.phaseStatus.civ2Done[2] ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                                <div className={`h-1 w-6 rounded ${entry.phaseStatus.civ3Done[0] ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleExportEntry(e, entry.worldId)}
                                disabled={exportingId === entry.worldId}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded border border-white/20 uppercase font-bold"
                            >
                                {exportingId === entry.worldId ? "..." : "EXPORT"}
                            </button>
                            <button onClick={(e) => handleDelete(e, entry.worldId)} className="p-2 text-red-500 hover:bg-red-900/20 rounded">
                                DELETE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
