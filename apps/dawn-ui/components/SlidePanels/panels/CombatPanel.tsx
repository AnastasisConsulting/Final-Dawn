import React, { useState } from 'react';
import { rollD10Pool } from 'eideus-combat';

type Category = 'attack' | 'defend' | 'items' | 'skills' | 'tech';

interface CombatPanelProps {
  path?: 'STR' | 'DEX' | 'INT';
  systemLevel?: number;
  lawfulness?: number;
  entropy?: number;
}

const ACTIONS: Record<Category, string[]> = {
  attack: ['Strike', 'Overload', 'Pierce Vent', 'Suppressive Burst'],
  defend: ['Brace', 'Redirect', 'Harden Plating', 'Smoke Cover'],
  items: ['Stim Patch', 'Coolant Vial', 'Nano Grenade', 'Decoy Beacon'],
  skills: ['Signature Move', 'Subclass Trick', 'Crowd Control', 'Channel Pressure'],
  tech: ['Patch Protocol', 'Loopbreaker', 'Signal Jam', 'Reconfigure Field'],
};

const TARGETS = ['Self', 'Ally', 'Enemy A', 'Enemy B', 'Enemy C'];

export const CombatPanel: React.FC<CombatPanelProps> = ({ path = 'STR', systemLevel = 3, lawfulness = 0.4, entropy = 0.5 }) => {
  const [category, setCategory] = useState<Category>('attack');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('Enemy A');
  const [log, setLog] = useState<string[]>([]);

  const accentColor =
    path === 'STR' ? '#22d3ee' : path === 'DEX' ? '#fbbf24' : '#e879f9';
  const accentBg =
    path === 'STR' ? '#0b1f24' : path === 'DEX' ? '#261c0a' : '#2a0f23';

  return (
    <div className="space-y-3 text-sm text-neutral-200">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.3em]" style={{ color: accentColor }}>
          Combat Wheel (d10)
        </div>
        <div className="text-[11px] text-neutral-500">White Wolf System · 8+ Success</div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 border border-neutral-800 bg-black/30 rounded p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Squad (You)</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>Operative</span><span className="text-neutral-500">HP 100</span></div>
            <div className="flex justify-between"><span>NavBot (drone)</span><span className="text-neutral-500">HP 60</span></div>
            <div className="flex justify-between"><span>Vizzy (projector)</span><span className="text-neutral-500">HP 40</span></div>
          </div>
        </div>

        <div className="col-span-2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-full pointer-events-none" />
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full border border-neutral-800 bg-black/40 shadow-[0_0_30px_rgba(0,0,0,0.4)]" />
              <div className="absolute inset-6 rounded-full border border-neutral-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">Selected</div>
                  <div className="text-white text-lg font-semibold">{selectedAction || 'Choose action'}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">Target: {selectedTarget}</div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3">
                  {(['attack', 'defend', 'items', 'skills', 'tech'] as Category[]).map(cat => {
                    const isActive = category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className="px-3 py-2 text-xs uppercase tracking-[0.2em] rounded border transition-colors border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-600"
                        style={isActive ? { borderColor: accentColor, backgroundColor: accentBg, color: '#fff' } : {}}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 border border-neutral-800 bg-black/30 rounded p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Enemy Team</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>Hunter A</span><span className="text-neutral-500">HP 90</span></div>
            <div className="flex justify-between"><span>Hunter B</span><span className="text-neutral-500">HP 90</span></div>
            <div className="flex justify-between"><span>Drone Swarm</span><span className="text-neutral-500">HP 120</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-neutral-800 bg-black/30 rounded p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Available Actions</div>
          <div className="space-y-1">
            {ACTIONS[category].map(action => (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                className="w-full text-left px-3 py-2 rounded border text-sm transition-colors border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-600"
                style={selectedAction === action ? { borderColor: accentColor, backgroundColor: accentBg, color: '#fff' } : {}}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-neutral-800 bg-black/30 rounded p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Targets</div>
          <div className="grid grid-cols-2 gap-2">
            {TARGETS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTarget(t)}
                className="px-2 py-2 rounded border text-sm transition-colors border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-600"
                style={selectedTarget === t ? { borderColor: accentColor, backgroundColor: accentBg, color: '#fff' } : {}}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2">Targeting is context-sensitive.</div>
          <div className="mt-3">
            <button
              className="w-full px-3 py-2 border border-cyan-600 text-cyan-100 text-xs uppercase tracking-widest bg-cyan-900/20 hover:bg-cyan-900/40 active:scale-95 disabled:opacity-50"
              onClick={() => {
                const difficulty = 8;
                const playerPool = path === 'STR' ? 8 : path === 'DEX' ? 6 : 7;
                const enemyPool = Math.max(2, Math.round(systemLevel * 1.5));

                const playerResult = rollD10Pool(playerPool, difficulty);
                const enemyResult = rollD10Pool(enemyPool, difficulty);

                const outcome = playerResult.successes >= enemyResult.successes ? 'Victory' : 'Defeat';
                const botchText = playerResult.isBotch ? ' (BOTCH!)' : '';

                setLog(prev => [
                  `${selectedAction || 'Action'} vs ${selectedTarget}: ${playerResult.successes}${botchText} vs ${enemyResult.successes}. [${playerResult.dice.join(',')}] vs [${enemyResult.dice.join(',')}]. Result: ${outcome}`,
                  ...prev,
                ].slice(0, 5));
              }}
              disabled={!selectedAction}
            >
              Roll d10 Pool
            </button>
          </div>
        </div>
      </div>

      {log.length > 0 && (
        <div className="border border-neutral-800 bg-black/30 rounded p-3 text-xs text-neutral-300 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Combat Log</div>
          {log.map((l, idx) => <div key={idx} className="border-b border-white/5 pb-1">{l}</div>)}
        </div>
      )}
    </div>
  );
};
