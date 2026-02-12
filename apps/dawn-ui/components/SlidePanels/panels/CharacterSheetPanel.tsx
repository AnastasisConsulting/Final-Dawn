/**
 * UI STABILITY WARNING: 
 * This component is part of the established "High-Density / Professional Sleek" UI standard.
 * DO NOT modify the 10-dot matrix scaling, font sizes (text-[11px]), or layout density.
 * Maintain the Hybrid White Wolf aesthetic at the current high-density scale.
 */
import React, { useMemo } from 'react';
import { useGame } from '../../../src/context/GameContext';
import { PersistenceService } from '../../../src/services/PersistenceService';

type AttributeKey = 'STR' | 'DEX' | 'INT' | 'CON' | 'WIS' | 'CHA';

const ATTRIBUTE_GROUPS = [
  {
    title: 'Kinetic',
    items: [
      { key: 'STR', label: 'STR', hint: 'Force' },
      { key: 'DEX', label: 'DEX', hint: 'Control' },
    ]
  },
  {
    title: 'Struc',
    items: [
      { key: 'CON', label: 'CON', hint: 'Mass' },
      { key: 'WIS', label: 'WIS', hint: 'Focus' },
    ]
  },
  {
    title: 'Cogni',
    items: [
      { key: 'INT', label: 'INT', hint: 'Logic' },
      { key: 'CHA', label: 'CHA', hint: 'Flow' },
    ]
  }
];

const SKILL_GROUPS = [
  {
    title: 'Violence',
    items: [
      { key: 'Attack', label: 'Atk' },
      { key: 'Defend', label: 'Def' },
      { key: 'Evade', label: 'Eva' },
    ]
  },
  {
    title: 'Systems',
    items: [
      { key: 'Hack', label: 'Hck' },
      { key: 'Scan', label: 'Scn' },
      { key: 'Pilot', label: 'Plt' },
    ]
  },
  {
    title: 'Social',
    items: [
      { key: 'Negotiate', label: 'Neg' },
    ]
  }
];

const SUBCLASS_BY_CORE: Record<string, string[]> = {
  Vanguard: ['Merc', 'Warden'],
  Shade: ['Saboteur', 'Ghost'],
  Cipher: ['Technomancer', 'Oracle'],
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const buyCost = (kind: 'attribute' | 'skill', nextValue: number) => (kind === 'attribute' ? 4 : 2) * nextValue;

const DotDisplay: React.FC<{ value: number; max?: number; color?: string }> = ({ value, max = 10, color = '#22d3ee' }) => {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full border border-white/5"
          style={{
            backgroundColor: i < value ? color : 'rgba(255,255,255,0.03)',
            boxShadow: i < value ? `0 0 3px ${color}80` : 'none',
          }}
        />
      ))}
    </div>
  );
};

export const CharacterSheetPanel: React.FC = () => {
  const { state: player, actions } = useGame();

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
    const nextXp = 500 + player.level * 250;
    if (player.xp < nextXp) return;
    actions.levelUp(nextXp);
  };

  const accentColor = player.identity.core === 'Cipher' ? '#e879f9' : player.identity.core === 'Shade' ? '#fbbf24' : '#22d3ee';

  return (
    <div className="h-full flex flex-col space-y-2 font-mono text-neutral-300 select-none overflow-hidden text-[11px]">
      {/* --- CONDENSED HYBRID CARD HEADER --- */}
      <div className="relative p-3 rounded border border-neutral-700/30 bg-black/40 overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-lg font-bold italic" style={{ color: accentColor }}>
              {player.identity.core?.slice(0, 1) || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="text-neutral-500 uppercase tracking-tighter">ID //</span>
                <span style={{ color: accentColor }}>{player.identity.name || 'ANONYMOUS'}</span>
                <span className="text-neutral-600">::</span>
                <span className="text-neutral-400 uppercase">{player.identity.sub || player.identity.core || 'PROVISIONAL'}</span>
              </div>
              <div className="flex gap-4 mt-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-neutral-500 uppercase">Rank</span>
                  <span className="text-sm font-bold text-neutral-200">{player.level}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-neutral-500 uppercase">Credit/XP</span>
                  <span className="text-white font-bold">{player.xp.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <button
              onClick={tryLevelUp}
              disabled={player.xp < (500 + player.level * 250)}
              className="px-3 py-1 text-[9px] uppercase font-bold tracking-widest border border-white/10 hover:border-white/20 transition-all active:scale-95 disabled:opacity-10 bg-white/5"
              style={{ color: accentColor, borderColor: `${accentColor}40` }}
            >
              UPGRADE
            </button>
            <div className="text-[8px] text-neutral-600 mt-1 tabular-nums">
              REQ: {(500 + player.level * 250).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 flex-1 overflow-hidden">
        {/* --- ATTRIBUTES: EXTREMELY SLEEK --- */}
        <div className="col-span-4 flex flex-col space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {ATTRIBUTE_GROUPS.map(group => (
            <div key={group.title} className="bg-white/5 border border-white/5 p-2 px-3">
              <div className="text-[8px] uppercase tracking-[2px] text-neutral-600 mb-2">{group.title}</div>
              <div className="space-y-1.5">
                {group.items.map(item => {
                  const val = player.attributes[item.key] || 0;
                  const cost = buyCost('attribute', val + 1);
                  return (
                    <div key={item.key} className="flex justify-between items-center group/item h-4 px-1 rounded hover:bg-white/5">
                      <span className="text-[10px] text-neutral-400 font-bold tracking-tighter">{item.key}</span>
                      <div className="flex items-center gap-2">
                        <DotDisplay value={val} max={10} color={accentColor} />
                        <button
                          onClick={() => handleBuy('attribute', item.key)}
                          disabled={player.xp < cost || val >= 10}
                          className="w-3 h-3 flex items-center justify-center text-[7px] text-neutral-600 opacity-0 group-hover/item:opacity-100 hover:text-white transition-opacity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* HULL MINI-SUMMARY */}
          <div className="mt-auto bg-black/40 border border-white/5 p-2 grid grid-cols-3 gap-1 text-[9px]">
            <div className="flex flex-col items-center border-r border-white/5">
              <span className="text-neutral-600 uppercase">H</span>
              <span className="text-orange-400/80 font-bold">{player.flightStats.maxHull}</span>
            </div>
            <div className="flex flex-col items-center border-r border-white/5">
              <span className="text-neutral-600 uppercase">S</span>
              <span className="text-blue-400/80 font-bold">{player.flightStats.maxShield}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-neutral-600 uppercase">V</span>
              <span className="text-red-400/80 font-bold">{player.flightStats.weaponLevel + 1}</span>
            </div>
          </div>
        </div>

        {/* --- SKILLS & PROGRESSION: HIGH DENSITY --- */}
        <div className="col-span-8 flex flex-col space-y-2 overflow-y-auto custom-scrollbar">
          <div className="bg-white/5 border border-white/5 p-3 flex-1">
            <div className="text-[8px] uppercase tracking-[3px] text-neutral-600 mb-3 font-bold">Protocol Competency // Static</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {SKILL_GROUPS.flatMap(g => g.items).map(skill => {
                const val = player.skillLevels[skill.key] || 0;
                const cost = buyCost('skill', val + 1);
                return (
                  <div key={skill.key} className="flex justify-between items-center group/skill py-0.5 px-1.5 hover:bg-white/5 border-l border-white/0 hover:border-white/10 transition-all">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-tighter">{skill.label}</span>
                    <div className="flex items-center gap-1.5">
                      <DotDisplay value={val} max={10} color={accentColor} />
                      <button
                        onClick={() => handleBuy('skill', skill.key)}
                        disabled={player.xp < cost || val >= 10}
                        className="text-[7px] text-neutral-600 opacity-0 group-hover/skill:opacity-100"
                      >
                        BUY
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { phase: '1', lvl: 7, val: player.identity.sub },
              { phase: '2', lvl: 14, val: player.identity.cross },
              { phase: '3', lvl: 21, val: player.identity.master },
            ].map(tier => (
              <div key={tier.phase} className="p-1 px-2 border border-white/5 bg-black/20 text-[9px] flex justify-between items-center">
                <span className="text-neutral-600 tracking-tighter">P.{tier.phase}</span>
                <span className="font-bold text-neutral-400 truncate ml-2">
                  {tier.val || (player.level >= tier.lvl ? 'LOCKED' : `L${tier.lvl}`)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => PersistenceService.exportToDisk()}
              className="flex-1 text-[8px] uppercase tracking-[2px] py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-neutral-300 transition-all"
            >
              Dump State
            </button>
            <button
              onClick={async () => {
                const data = await PersistenceService.importFromDisk();
                if (data) actions.loadGame(data.gameState);
              }}
              className="flex-1 text-[8px] uppercase tracking-[2px] py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-neutral-300 transition-all"
            >
              Inject Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
