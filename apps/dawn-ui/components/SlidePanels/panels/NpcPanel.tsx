// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/panels/NpcPanel.tsx

import React, { useMemo, useState } from 'react';
import { useKernel } from '../../../hooks/useKernel';
import { useGame } from '../../../src/context/GameContext';
import { runTurn } from '../../../services/orchestrator';

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


export const NpcPanel: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(NPCS[0].id);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Record<string, ChatMsg[]>>(() => ({}));

  const activeNpc = useMemo(() => NPCS.find((n) => n.id === activeId) ?? null, [activeId]);
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

  return (
    <div className="p-4 h-full flex flex-col bg-gray-900/40">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-purple-300/70">NET</div>
          <h2 className="text-2xl font-bold text-purple-200 uppercase">NPC Interface</h2>
          <div className="text-xs text-neutral-400 font-mono mt-1">Comms + lorebook (placeholder chat)</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="w-1/3 flex flex-col border border-gray-700 rounded-lg p-3 bg-gray-800/60 overflow-y-auto custom-scrollbar">
          <div className="font-semibold text-purple-200 mb-2 border-b border-purple-500/30 pb-1">Contacts</div>
          <ul className="space-y-2">
            {NPCS.map((npc) => {
              const active = npc.id === activeId;
              const disp =
                npc.disposition === 'friendly'
                  ? 'text-green-300'
                  : npc.disposition === 'hostile'
                    ? 'text-red-300'
                    : 'text-gray-300';
              return (
                <li key={npc.id}>
                  <button
                    onClick={() => setActiveId(npc.id)}
                    className={`w-full text-left p-2 rounded transition-colors duration-150 text-sm ${active
                      ? 'bg-purple-900/70 text-purple-100 ring-1 ring-purple-500'
                      : 'bg-gray-700/40 hover:bg-gray-600/40 text-gray-200'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{npc.name}</span>
                      <span className={`text-[10px] uppercase tracking-widest ${disp}`}>{npc.disposition}</span>
                    </div>
                    <div className="text-xs text-gray-500">{npc.faction}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="w-2/3 flex flex-col border border-gray-700 rounded-lg bg-gray-800/60 overflow-hidden">
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
