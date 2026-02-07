import React, { useMemo } from 'react';
import { useGame } from '../../../src/context/GameContext';

type AttributeKey = 'STR' | 'DEX' | 'INT' | 'CON' | 'WIS' | 'CHA';
type SkillKey = string;

type CoreClass = string;
type SubClass = string;

const ATTRIBUTES: { key: AttributeKey; label: string; hint: string }[] = [
  { key: 'STR', label: 'STR', hint: 'Force / pressure' },
  { key: 'DEX', label: 'DEX', hint: 'Control / timing' },
  { key: 'INT', label: 'INT', hint: 'Model / inference' },
  { key: 'CON', label: 'CON', hint: 'Endurance' },
  { key: 'WIS', label: 'WIS', hint: 'Cooldowns / focus' },
  { key: 'CHA', label: 'CHA', hint: 'Social leverage' },
];

const SKILLS: { key: string; label: string; hint: string }[] = [
  { key: 'Attack', label: 'Attack', hint: 'Commit violence (selectively)' },
  { key: 'Defend', label: 'Defend', hint: 'Reduce incoming harm' },
  { key: 'Evade', label: 'Evade', hint: 'Dodge / disengage' },
  { key: 'Hack', label: 'Hack', hint: 'Systems intrusion' },
  { key: 'Pilot', label: 'Pilot', hint: 'Flight-one performance' },
  { key: 'Negotiate', label: 'Negotiate', hint: 'Bargains & threats' },
  { key: 'Scan', label: 'Scan', hint: 'Find the real thing' },
];

const SUBCLASS_BY_CORE: Record<string, string[]> = {
  Vanguard: ['Merc', 'Warden'],
  Shade: ['Saboteur', 'Ghost'],
  Cipher: ['Technomancer', 'Oracle'],
};

const ALL_SUBCLASSES: string[] = ['Merc', 'Warden', 'Saboteur', 'Ghost', 'Technomancer', 'Oracle'];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const xpToNext = (level: number) => 500 + level * 250;
const buyCost = (kind: 'attribute' | 'skill', nextValue: number) => (kind === 'attribute' ? 4 : 2) * nextValue;

export const CharacterSheetPanel: React.FC = () => {
  const { state: player, actions } = useGame();

  const nextXp = useMemo(() => xpToNext(player.level), [player.level]);

  const handleBuy = (kind: 'attribute' | 'skill', key: string) => {
    const current = kind === 'attribute' ? player.attributes[key] : player.skillLevels[key];
    const nextValue = clamp(current + 1, 0, 10);
    if (nextValue === current) return;

    const cost = buyCost(kind, nextValue);
    if (player.xp < cost) return;

    if (kind === 'attribute') {
      actions.buyAttribute(key, cost);
    } else {
      actions.buySkillLevel(key, cost);
    }
  };

  const tryLevelUp = () => {
    if (player.xp < nextXp) return;
    actions.levelUp(nextXp);
  };

  const canUnlockSub = player.level >= 7;
  const canUnlockCross = player.level >= 14 && !!player.identity.sub;
  const canUnlockMaster = player.level >= 21 && !!player.identity.cross;

  const availableSub = SUBCLASS_BY_CORE[player.identity.core || 'Vanguard'] || [];
  const availableCross = ALL_SUBCLASSES.filter((sc) => !availableSub.includes(sc));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">UNIT</div>
          <h2 className="text-2xl font-bold text-cyan-200 uppercase">Operator Profile</h2>
          <div className="text-xs text-neutral-400 font-mono mt-1">
            Core: <span className="text-neutral-200">{player.identity.core || 'Pending'}</span>
          </div>
        </div>

        <div className="border border-neutral-800 bg-black/30 rounded px-4 py-3 text-right">
          <div className="text-xs text-neutral-500 uppercase tracking-widest">Level</div>
          <div className="text-2xl font-bold text-white leading-tight">{player.level}</div>
          <div className="text-xs text-neutral-400 font-mono">XP: {player.xp.toLocaleString()}</div>
          <button
            onClick={tryLevelUp}
            disabled={player.xp < nextXp}
            className="mt-2 w-full text-xs uppercase tracking-widest border border-cyan-700/60 bg-cyan-900/20 hover:bg-cyan-900/35 text-cyan-100 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Level Up · {nextXp}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        <div className="border border-neutral-800 bg-black/30 rounded p-4 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Attributes</div>
          <ul className="space-y-2">
            {ATTRIBUTES.map((a) => {
              const current = player.attributes[a.key] || 0;
              const cost = buyCost('attribute', clamp(current + 1, 0, 10));
              const canBuy = current < 10 && player.xp >= cost;
              return (
                <li key={a.key} className="flex items-center justify-between gap-3 border border-neutral-800 rounded bg-neutral-900/30 px-3 py-2">
                  <div>
                    <div className="text-sm text-neutral-100 font-semibold">{a.label}</div>
                    <div className="text-[11px] text-neutral-500">{a.hint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-cyan-200 w-8 text-center">{current}</div>
                    <button
                      onClick={() => handleBuy('attribute', a.key)}
                      disabled={!canBuy}
                      className="text-[10px] uppercase tracking-widest px-3 py-2 rounded border border-neutral-700 bg-black/40 hover:border-cyan-500/50 hover:bg-cyan-900/15 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + ({cost})
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border border-neutral-800 bg-black/30 rounded p-4 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Skills</div>
          <ul className="space-y-2">
            {SKILLS.map((s) => {
              const current = player.skillLevels[s.key] || 0;
              const cost = buyCost('skill', clamp(current + 1, 0, 10));
              const canBuy = current < 10 && player.xp >= cost;
              return (
                <li key={s.key} className="flex items-center justify-between gap-3 border border-neutral-800 rounded bg-neutral-900/30 px-3 py-2">
                  <div>
                    <div className="text-sm text-neutral-100 font-semibold">{s.label}</div>
                    <div className="text-[11px] text-neutral-500">{s.hint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-cyan-200 w-8 text-center">{current}</div>
                    <button
                      onClick={() => handleBuy('skill', s.key)}
                      disabled={!canBuy}
                      className="text-[10px] uppercase tracking-widest px-3 py-2 rounded border border-neutral-700 bg-black/40 hover:border-cyan-500/50 hover:bg-cyan-900/15 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + ({cost})
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-neutral-800 pt-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Class Progression</div>

            <div className="space-y-3">
              <div className={`border rounded p-3 ${canUnlockSub ? 'border-cyan-700/50 bg-cyan-900/10' : 'border-neutral-800 bg-black/20 opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-neutral-300">Phase I · Subclass</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Unlock: L7</div>
                </div>
                {!canUnlockSub && <div className="text-xs text-neutral-500 mt-2">Locked until level 7.</div>}
                {canUnlockSub && (
                  <div className="mt-2">
                    {player.identity.sub ? (
                      <div className="text-sm text-neutral-200">Selected: <span className="text-cyan-200 font-semibold">{player.identity.sub}</span></div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableSub.map((sc) => (
                          <button
                            key={sc}
                            onClick={() => actions.setIdentity(undefined, sc)}
                            className="text-xs px-3 py-2 rounded border border-neutral-800 bg-neutral-900/40 hover:border-cyan-500/40"
                          >
                            {sc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`border rounded p-3 ${canUnlockCross ? 'border-cyan-700/50 bg-cyan-900/10' : 'border-neutral-800 bg-black/20 opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-neutral-300">Phase II · Cross-Class</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Unlock: L14</div>
                </div>
                {!canUnlockCross && <div className="text-xs text-neutral-500 mt-2">Locked until level 14 (and after subclass selection).</div>}
                {canUnlockCross && (
                  <div className="mt-2">
                    {player.identity.cross ? (
                      <div className="text-sm text-neutral-200">Selected: <span className="text-cyan-200 font-semibold">{player.identity.cross}</span></div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableCross.map((sc) => (
                          <button
                            key={sc}
                            onClick={() => actions.setIdentity(undefined, undefined, sc)}
                            className="text-xs px-3 py-2 rounded border border-neutral-800 bg-neutral-900/40 hover:border-cyan-500/40"
                          >
                            {sc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`border rounded p-3 ${canUnlockMaster ? 'border-cyan-700/50 bg-cyan-900/10' : 'border-neutral-800 bg-black/20 opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-neutral-300">Phase III · Mastery</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Unlock: L21</div>
                </div>
                {!canUnlockMaster && <div className="text-xs text-neutral-500 mt-2">Locked until level 21 (and after cross-class selection).</div>}
                {canUnlockMaster && (
                  <div className="mt-2">
                    {player.identity.master ? (
                      <div className="text-sm text-neutral-200">Mastered: <span className="text-cyan-200 font-semibold">{player.identity.master}</span></div>
                    ) : (
                      <button
                        onClick={() => actions.setIdentity(undefined, undefined, undefined)}
                        className="w-full text-xs uppercase tracking-widest px-3 py-2 rounded border border-cyan-700/50 bg-cyan-900/15 hover:bg-cyan-900/25"
                      >
                        Attain Mastery
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-800 pt-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Flight Configuration</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between border border-neutral-800 rounded bg-neutral-900/30 px-3 py-2">
                <div>
                  <div className="text-sm text-neutral-100 font-semibold">Weapon Level</div>
                  <div className="text-[11px] text-neutral-500">Output Multiplier</div>
                </div>
                <div className="text-lg font-bold text-cyan-200">{player.flightStats.weaponLevel} / 3</div>
              </div>
              <div className="flex items-center justify-between border border-neutral-800 rounded bg-neutral-900/30 px-3 py-2">
                <div>
                  <div className="text-sm text-neutral-100 font-semibold">Hull Integrity</div>
                  <div className="text-[11px] text-neutral-500">Plating & Structure</div>
                </div>
                <div className="text-lg font-bold text-orange-200">{player.flightStats.maxHull} HP</div>
              </div>
              <div className="flex items-center justify-between border border-neutral-800 rounded bg-neutral-900/30 px-3 py-2">
                <div>
                  <div className="text-sm text-neutral-100 font-semibold">Shield Capacity</div>
                  <div className="text-[11px] text-neutral-500">Energy Buffer</div>
                </div>
                <div className="text-lg font-bold text-blue-200">{player.flightStats.maxShield} MJ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
