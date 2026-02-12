import React, { useRef } from 'react';
import { Character, Lorebook } from '../types';

interface LibraryPanelProps {
  characters: Character[];
  activeCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onCreateCharacter: () => void;
  onOpenBatchCreate: () => void;
  lorebooks: Lorebook[];
  activeLorebookId: string;
  onSelectLorebook: (id: string) => void;
  onImportCharacter: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCharacter: () => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({
  characters,
  activeCharacterId,
  onSelectCharacter,
  onCreateCharacter,
  onOpenBatchCreate,
  lorebooks,
  activeLorebookId,
  onSelectLorebook,
  onImportCharacter,
  onExportCharacter
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-64 shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-blue-400 mb-1">Library</h2>
        <p className="text-xs text-gray-500">Characters & World Info</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Characters</h3>
            <div className="flex gap-1">
                <button 
                onClick={onOpenBatchCreate}
                className="text-[10px] bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-2 py-1 rounded border border-purple-800"
                title="Batch Create"
                >
                Batch
                </button>
                <button 
                onClick={onCreateCharacter}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                title="New Character"
                >
                +
                </button>
            </div>
          </div>
          
          {/* Import/Export Controls */}
          <div className="flex gap-2 px-2 mb-3">
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={onImportCharacter} 
               className="hidden" 
               accept=".json"
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="flex-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 rounded border border-gray-700"
             >
               Import JSON
             </button>
             <button 
               onClick={onExportCharacter}
               className="flex-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 rounded border border-gray-700"
             >
               Export
             </button>
          </div>

          <ul className="space-y-1">
            {characters.map((char) => (
              <li key={char.id}>
                <button
                  onClick={() => onSelectCharacter(char.id)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${
                    char.id === activeCharacterId 
                      ? 'bg-gray-800 text-white border-l-2 border-blue-500' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    {char.avatarUrl ? (
                      <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs font-bold">
                        {char.name.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <span className="truncate font-medium text-sm">{char.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
           <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lorebooks</h3>
          </div>
          <ul className="space-y-1">
            {lorebooks.map((lore) => (
              <li key={lore.id}>
                <button
                  onClick={() => onSelectLorebook(lore.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    lore.id === activeLorebookId
                      ? 'bg-gray-800 text-white border-l-2 border-purple-500'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <span className="truncate">{lore.name}</span>
                  <span className="ml-2 text-xs text-gray-600">({lore.entries.length} entries)</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
        <p>Auto-save enabled.</p>
        GeminiRP Station v1.2
      </div>
    </div>
  );
};

export default LibraryPanel;