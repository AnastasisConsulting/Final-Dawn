// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/panels/NpcPanel.tsx

import React, { useMemo, useState } from 'react';
import { useKernel } from '../../../hooks/useKernel';
import { useGame } from '../../../src/context/GameContext';
import { runTurn } from '../../../services/orchestrator';
import { MAIN_CHARACTERS, CharacterCard } from '../../../src/data/characterData';
import { User, Upload, X } from 'lucide-react';

type Npc = {
  id: string;
  name: string;
  faction: string;
  disposition: 'friendly' | 'neutral' | 'hostile';
  description: string;
  personality: string[];
};

type ChatMsg = { role: 'user' | 'npc'; text: string };

const NPCS: Npc[] = [
  {
    id: 'npc_ion_savant',
    name: 'Ion Savant',
    faction: 'Whispering Ion',
    disposition: 'neutral',
    description: 'A theoretician with too many equations and not enough sleep.',
    personality: ['precise', 'slightly smug', 'helpful when respected'],
  },
  {
    id: 'npc_slag_fence',
    name: 'Slag Fence',
    faction: 'Dockside Brokers',
    disposition: 'friendly',
    description: 'Sells parts, rumors, and plausible deniability.',
    personality: ['fast-talking', 'pragmatic', 'transactional'],
  },
  {
    id: 'npc_warden_ember',
    name: 'Warden Ember',
    faction: 'Sentinel Dome',
    disposition: 'hostile',
    description: 'Security officer who treats curiosity like contraband.',
    personality: ['disciplined', 'suspicious', 'dry humor'],
  },
  {
    id: 'npc_nav_relic',
    name: 'Relic Cartographer',
    faction: 'Deep Lattice',
    disposition: 'neutral',
    description: 'Maps that shouldn’t exist. Coordinates that shouldn’t work.',
    personality: ['cryptic', 'obsessive', 'pattern-seeking'],
  },
  {
    id: 'npc_merc_kin',
    name: 'Merc Kin',
    faction: 'Free Companies',
    disposition: 'friendly',
    description: 'A merc who’s seen enough to stop romanticizing violence.',
    personality: ['direct', 'protective', 'wry'],
  },
];

/**
 * Character Card Overlay Sub-component
 */
const CharacterCardOverlay: React.FC<{
  character: CharacterCard | any;
  onClose: () => void;
  avatarUrl?: string;
  onAvatarClick: () => void;
  relationships: any;
}> = ({ character, onClose, avatarUrl, onAvatarClick, relationships }) => {
  const isMain = ['lyra', 'vizzy', 'navbot', 'gm'].includes(character.id);

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0c] flex flex-col border border-purple-500/40 rounded-lg overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
      <div className="flex justify-between items-center px-6 py-4 border-b border-purple-500/20 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <h3 className="text-sm font-bold text-purple-100 tracking-[0.3em] uppercase">Data_Node // {character.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-red-400 hover:bg-neutral-800/50 p-1.5 rounded-md transition-all group"
          title="Close Data Node"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Stats & Avatar */}
        <div className="w-[320px] p-6 border-r border-purple-500/10 flex flex-col items-center bg-black/40 overflow-y-auto custom-scrollbar">
          <button
            onClick={onAvatarClick}
            className="w-40 h-40 rounded-xl border-2 border-purple-500/30 bg-purple-900/10 flex items-center justify-center overflow-hidden hover:border-purple-400/60 group relative mb-8 shadow-lg transition-all hover:scale-[1.02]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt={character.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-black">
                <span className="text-7xl font-bold text-purple-200/40">{character.name[0]}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] uppercase font-bold text-purple-200 text-center p-3">
              <Upload size={20} className="mb-2" />
              Click to Update Primary Visual Record
            </div>
          </button>

          <div className="w-full space-y-5">
            <div>
              <div className="text-[9px] text-purple-400/50 uppercase tracking-[0.2em] mb-1 font-mono">Registry_Name</div>
              <div className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{character.name}</div>
            </div>

            <div>
              <div className="text-[9px] text-purple-400/50 uppercase tracking-[0.2em] mb-1 font-mono">Functional_Role</div>
              <div className="text-xs text-purple-200 py-1 px-2 bg-purple-900/20 border border-purple-500/20 inline-block rounded-sm">{character.role || character.faction}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-[9px] text-purple-400/50 uppercase tracking-[0.2em] mb-1 font-mono">Temporal_Age</div>
                <div className="text-xs text-neutral-300">{character.age || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[9px] text-purple-400/50 uppercase tracking-[0.2em] mb-1 font-mono">Construct_Type</div>
                <div className="text-xs text-neutral-300">{character.bodyType || 'Bio-Mechanical'}</div>
              </div>
            </div>

            {character.stats && Object.entries(character.stats as Record<string, string | number>).map(([k, v]) => (
              <div key={k} className="pt-1">
                <div className="text-[9px] text-purple-400/50 uppercase tracking-[0.2em] mb-1 font-mono">{k}</div>
                <div className="text-xs text-neutral-200 font-mono tracking-tighter">{String(v)}</div>
              </div>
            ))}

            {/* Relational Scores */}
            {isMain && character.id !== 'gm' && (
              <div className="mt-8 pt-6 border-t border-purple-500/20">
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-purple-500/50" />
                  Neural Sync Status
                </div>
                <div className="space-y-5">
                  {['player', 'lyra', 'vizzy', 'navbot'].filter(t => t !== character.id).map(target => {
                    const val = target === 'player' ? (relationships[character.id] || 0) : (50 + (Math.random() * 10 - 5));
                    return (
                      <div key={target} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                          <span className="text-neutral-500 font-mono">{target} // link</span>
                          <span className="text-purple-300 font-bold">{Math.round(val)}%</span>
                        </div>
                        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-purple-900 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all duration-1000"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Backstory & Bio */}
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-gradient-to-b from-black/20 to-transparent">
          <div className="max-w-xl">
            <div className="relative mb-10">
              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/60 to-transparent" />
              <div className="font-mono text-xs text-purple-300/80 leading-relaxed uppercase tracking-wide">
                {character.backstory || character.description}
              </div>
            </div>

            <div className="text-neutral-400 leading-relaxed text-sm space-y-6 font-serif tracking-wide border-t border-white/5 pt-8">
              {character.bio ? character.bio.split('\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              )) : (
                <p>Standard profile diagnostics available. Background data remains categorized under local planetary registry {character.faction}.</p>
              )}
            </div>

            {isMain && (
              <div className="mt-12 p-4 bg-purple-500/5 border border-purple-500/20 rounded text-[10px] text-purple-400/60 font-mono italic">
                  // WARNING: ACCESSING CORE MEMORY LATTICE FOR {character.name.toUpperCase()}...
                <br />// ENCRYPTED DATA DETECTED. SYNC RATIO INSUFFICIENT FOR FULL DISCLOSURE.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NpcPanel: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(MAIN_CHARACTERS[0].id);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Record<string, ChatMsg[]>>(() => ({}));

  // Custom states for avatars and cards
  const [selectedCharCardId, setSelectedCharCardId] = useState<string | null>(null);
  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('eideus-custom-avatars');
    return saved ? JSON.parse(saved) : {};
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const activeNpc = useMemo(() => {
    const mainWrapped = MAIN_CHARACTERS.map(c => ({
      ...c,
      faction: 'System/Main',
      disposition: 'friendly' as const,
      description: c.role,
      personality: []
    }));
    const all = [...mainWrapped, ...NPCS];
    return all.find((n) => n.id === activeId) ?? null;
  }, [activeId]);

  const selectedCard = useMemo(() => {
    const mainWrapped = MAIN_CHARACTERS.map(c => ({
      ...c,
      faction: 'System/Main',
      disposition: 'friendly' as const,
      description: c.role,
      personality: []
    }));
    const all = [...mainWrapped, ...NPCS];
    return all.find(n => n.id === selectedCharCardId) || null;
  }, [selectedCharCardId]);

  const chat = useMemo(() => (activeId ? history[activeId] ?? [] : []), [activeId, history]);

  /* New logic with orchestrator integration */
  const { state } = useKernel();
  const { state: gameState } = useGame();
  const [isTyping, setIsTyping] = useState(false);

  // Map local IDs to backend-friendly names
  const getRecipientName = (npcId: string): string => {
    const map: Record<string, string> = {
      'npc_ion_savant': 'Ion Savant',
      'npc_slag_fence': 'Slag Fence',
      'npc_warden_ember': 'Warden Ember',
      'npc_nav_relic': 'Relic Cartographer',
      'npc_merc_kin': 'Merc Kin'
    };
    return map[npcId] || 'Unknown';
  };

  const send = async () => {
    if (!activeNpc || !input.trim() || isTyping) return;
    const text = input.trim();
    setInput('');

    const userMsg: ChatMsg = { role: 'user', text };

    // Optimistic Update
    setHistory((prev) => {
      const next = { ...prev };
      const prevChat = next[activeNpc.id] ?? [];
      next[activeNpc.id] = [...prevChat, userMsg];
      return next;
    });

    setIsTyping(true);

    try {
      const sessionId = state.navContext.sessionId || 'session_void_fallback';

      // Build context similar to CenterPanel
      // In a real app, we'd pull from state.navContext completely
      const ctx: any = {
        sessionId,
        objectKey: state.address.full || 'G1-S1-O1',
        civIndex: state.navContext.civIndex ?? 0,
        cityIndex: state.navContext.cityIndex ?? 0,
        locIndex: state.navContext.locIndex ?? 0,
        llmConfig: gameState.settings.llm
      };

      const recipientName = getRecipientName(activeNpc.id);
      const result = await runTurn(text, recipientName, ctx);

      const reply: ChatMsg = { role: 'npc', text: result.response };

      setHistory((prev) => {
        const next = { ...prev };
        const prevChat = next[activeNpc.id] ?? [];
        next[activeNpc.id] = [...prevChat, reply].slice(-50);
        return next;
      });

    } catch (err: any) {
      setHistory((prev) => {
        const next = { ...prev };
        const prevChat = next[activeNpc.id] ?? [];
        next[activeNpc.id] = [...prevChat, { role: 'npc', text: `[COMM FAILURE]: ${err.message}` }];
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCharCardId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const next = { ...customAvatars, [selectedCharCardId]: url };
        setCustomAvatars(next);
        localStorage.setItem('eideus-custom-avatars', JSON.stringify(next));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAvatarBrowser = (charId: string) => {
    setSelectedCharCardId(charId);
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 h-full flex flex-col bg-gray-900/40">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-purple-300/70">NET</div>
          <h2 className="text-2xl font-bold text-purple-200 uppercase">NPC Interface</h2>
          <div className="text-xs text-neutral-400 font-mono mt-1">Comms + lorebook (placeholder chat)</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden relative">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarUpload}
        />

        <div className="w-1/3 flex flex-col border border-gray-700/50 rounded-lg p-3 bg-black/40 overflow-y-auto custom-scrollbar">
          {/* Main AI Modules Section */}
          <div className="mb-6">
            <div className="font-bold text-purple-400 text-[10px] uppercase tracking-[0.25em] mb-4 border-b border-purple-500/20 pb-1">Primary_AI_Modules</div>
            <div className="grid grid-cols-2 gap-3">
              {MAIN_CHARACTERS.map((char) => {
                const active = char.id === activeId;
                const rel = gameState.relationships[char.id as keyof typeof gameState.relationships] || 50;
                const avatar = customAvatars[char.id];

                return (
                  <div key={char.id} className="flex flex-col items-center group">
                    <button
                      onClick={() => setSelectedCharCardId(char.id)}
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all relative ${active ? 'border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'border-purple-500/20 hover:border-purple-500/50'
                        } bg-purple-950/20`}
                      title={`View ${char.name} Card`}
                    >
                      {avatar ? (
                        <img src={avatar} className="w-full h-full object-cover" alt={char.name} />
                      ) : (
                        <span className="text-xl font-bold text-purple-200/60 uppercase">{char.name[0]}</span>
                      )}
                      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Relational Bar */}
                    {char.id !== 'gm' && (
                      <div className="w-10 h-1 bg-gray-800 rounded-full mt-2 overflow-hidden border border-white/5" title={`Relational Sync: ${rel}%`}>
                        <div className="h-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.5)]" style={{ width: `${rel}%` }} />
                      </div>
                    )}

                    <button
                      onClick={() => setActiveId(char.id)}
                      className={`mt-1.5 text-[9px] uppercase tracking-tighter font-bold transition-colors ${active ? 'text-purple-200' : 'text-purple-400/50 hover:text-purple-300'}`}
                    >
                      {char.name.split(' ')[0]}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="font-bold text-cyan-400 text-[10px] uppercase tracking-[0.25em] mb-2 border-b border-cyan-500/20 pb-1">Local_Node_Contacts</div>
          <ul className="space-y-2">
            {NPCS.map((npc) => {
              const active = npc.id === activeId;
              const avatar = customAvatars[npc.id];
              const disp =
                npc.disposition === 'friendly'
                  ? 'text-green-400'
                  : npc.disposition === 'hostile'
                    ? 'text-red-400'
                    : 'text-neutral-400';
              return (
                <li key={npc.id} className="flex gap-2">
                  <button
                    onClick={() => setSelectedCharCardId(npc.id)}
                    className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden hover:border-cyan-500/50 transition-colors"
                  >
                    {avatar ? (
                      <img src={avatar} className="w-full h-full object-cover" alt={npc.name} />
                    ) : (
                      <span className="text-sm font-bold text-neutral-500 uppercase">{npc.name[0]}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveId(npc.id)}
                    className={`flex-1 text-left p-2 rounded transition-all duration-150 text-xs border ${active
                      ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-50'
                      : 'bg-neutral-800/40 border-transparent hover:bg-neutral-700/40 text-neutral-300'
                      }`}
                  >
                    <div className="flex items-center justify-between font-mono mb-0.5">
                      <span className="font-bold uppercase">{npc.name}</span>
                      <span className={`text-[8px] tracking-[0.1em] ${disp}`}>{npc.disposition}</span>
                    </div>
                    <div className="text-[9px] text-neutral-500 font-mono italic opacity-60">{npc.faction}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="w-2/3 flex flex-col border border-gray-700/50 rounded-lg bg-[#050507] overflow-hidden relative">
          {/* Character Card Overlay */}
          {selectedCard && (
            <CharacterCardOverlay
              character={selectedCard}
              onClose={() => setSelectedCharCardId(null)}
              avatarUrl={customAvatars[selectedCard.id]}
              onAvatarClick={() => openAvatarBrowser(selectedCard.id)}
              relationships={gameState.relationships}
            />
          )}

          {!activeNpc ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 italic">
              Select an NPC to view details or initiate comms.
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-purple-500/30 bg-gray-900/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-lg text-purple-200">{activeNpc.name}</div>
                    <div className="text-xs text-gray-400">{activeNpc.description}</div>
                    <div className="text-xs mt-1">
                      <span className="font-semibold text-gray-500">Faction:</span> {activeNpc.faction} ·{' '}
                      <span className="font-semibold text-gray-500">Traits:</span> {activeNpc.personality.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setHistory((prev) => {
                        const next = { ...prev };
                        delete next[activeNpc.id];
                        return next;
                      })
                    }
                    className="text-xs uppercase tracking-widest px-3 py-2 rounded border border-neutral-700 bg-black/30 hover:border-purple-500/50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {chat.length === 0 ? (
                  <div className="text-gray-500 italic">Open a channel. Keep it short; the universe is noisy.</div>
                ) : (
                  chat.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.role === 'user'
                          ? 'bg-cyan-800/70 text-cyan-100'
                          : 'bg-gray-700/70 text-gray-200'
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700/70 text-gray-400 p-2 rounded-lg text-sm text-xs italic animate-pulse">
                      {activeNpc.name} is typing...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-purple-500/30 bg-gray-900/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') send();
                    }}
                    placeholder={`Message ${activeNpc.name}...`}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded text-sm transition-colors duration-150 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
