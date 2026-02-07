// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/panels/CombatWheelPanel.tsx

import React, { useMemo, useState } from 'react';
import { useGame } from '../../../src/context/GameContext';

type TargetType = 'enemy' | 'ally' | 'self';
type WheelCategory = 'Offensive' | 'Defensive' | 'Restorative' | 'Items';

type Combatant = { id: string; name: string; hp: { current: number; max: number } };
type ActionDefinition = {
  id: string;
  label: string;
  classification: WheelCategory;
  targetType: TargetType;
  ap?: number;
};

const ACTIONS: ActionDefinition[] = [
  { id: 'atk_strike', label: 'Strike', classification: 'Offensive', targetType: 'enemy', ap: 2 },
  { id: 'atk_overload', label: 'Overload', classification: 'Offensive', targetType: 'enemy', ap: 3 },
  { id: 'def_brace', label: 'Brace', classification: 'Defensive', targetType: 'self', ap: 2 },
  { id: 'def_redirect', label: 'Redirect', classification: 'Defensive', targetType: 'ally', ap: 3 },
  { id: 'tech_patch', label: 'Patch Protocol', classification: 'Restorative', targetType: 'ally', ap: 2 },
  { id: 'tech_jam', label: 'Signal Jam', classification: 'Restorative', targetType: 'enemy', ap: 2 },
  { id: 'item_stim', label: 'Stim Patch', classification: 'Items', targetType: 'self', ap: 1 },
  { id: 'item_decoy', label: 'Decoy Beacon', classification: 'Items', targetType: 'enemy', ap: 1 },
];

const ENEMIES: Combatant[] = [
  { id: 'e1', name: 'Hunter A', hp: { current: 90, max: 90 } },
  { id: 'e2', name: 'Hunter B', hp: { current: 72, max: 90 } },
  { id: 'e3', name: 'Drone Swarm', hp: { current: 120, max: 120 } },
];

const ALLIES: Combatant[] = [
  { id: 'p', name: 'Operator', hp: { current: 100, max: 100 } },
  { id: 'a1', name: 'NavBot (drone)', hp: { current: 60, max: 60 } },
  { id: 'a2', name: 'Vizzy (projector)', hp: { current: 40, max: 40 } },
];

// NOTE: Tailwind can't tree-shake dynamic class names like bg-${accent}-...
// so we keep static variants below.
const ringBtnClass = (active: boolean, cat: WheelCategory) => {
  const base =
    'absolute w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10';
  if (!active) return `${base} bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400`;
  if (cat === 'Offensive') return `${base} bg-red-900/90 border-red-500 text-red-100 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.25)]`;
  if (cat === 'Defensive') return `${base} bg-blue-900/90 border-blue-500 text-blue-100 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.25)]`;
  if (cat === 'Restorative') return `${base} bg-green-900/90 border-green-500 text-green-100 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.25)]`;
  return `${base} bg-yellow-900/90 border-yellow-500 text-yellow-100 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.25)]`;
};

export const CombatWheelPanel: React.FC = () => {
  const { actions } = useGame();
  const [activeCategory, setActiveCategory] = useState<WheelCategory | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const actionsForCategory = useMemo(() => {
    if (!activeCategory) return [];
    return ACTIONS.filter((a) => a.classification === activeCategory);
  }, [activeCategory]);

  const targetsForAction = useMemo(() => {
    if (!selectedAction) return [];
    if (selectedAction.targetType === 'enemy') return ENEMIES;
    if (selectedAction.targetType === 'ally') return ALLIES;
    return [ALLIES[0]];
  }, [selectedAction]);

  const execute = (action: ActionDefinition, target?: Combatant) => {
    const tgt = action.targetType === 'self' ? ALLIES[0] : target;
    const line = `${action.label}${tgt ? ` → ${tgt.name}` : ''} (AP ${action.ap ?? 0})`;
    setLog((prev) => [line, ...prev].slice(0, 10));

    // Simulate Drops/XP
    if (action.classification === 'Offensive') {
      // Tiny chance for loot, 100% chance for XP
      actions.gainXp(10);
      if (Math.random() > 0.7) {
        const randomLoot = ['BLASTER_PISTOL', 'NANITE_KIT', 'DATA_CHIP'][Math.floor(Math.random() * 3)];
        // We need full item details. For now, construct a dummy item or import ITEMS from InventoryPanel if shared?
        // Ideally ITEMS should be in GameContext or a shared constant file.
        // I'll create an ad-hoc item here matching the type.
        actions.addItem({
          id: randomLoot,
          name: randomLoot.replace('_', ' '),
          type: randomLoot === 'NANITE_KIT' ? 'consumable' : randomLoot === 'DATA_CHIP' ? 'RESOURCE' : 'WEAPON',
          rarity: 'common',
          count: 1
        });
        setLog((prev) => [`LOOT DETECTED: ${randomLoot}`, ...prev].slice(0, 10));
      }
    }

    setActiveCategory(null);
    setSelectedAction(null);
  };

  const renderRingButton = (cat: WheelCategory, rotation: number, label: string) => (
    <button
      onClick={() => {
        setActiveCategory(activeCategory === cat ? null : cat);
        setSelectedAction(null);
      }}
      className={ringBtnClass(activeCategory === cat, cat)}
      style={{ transform: `rotate(${rotation}deg) translate(9rem) rotate(-${rotation}deg)` }}
    >
      <span className="font-bold text-xs tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">BIO</div>
          <h2 className="text-2xl font-bold text-cyan-200 uppercase">Combat Wheel</h2>
          <div className="text-xs text-neutral-400 font-mono mt-1">UI scaffold · rules engine plugs in later</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-4 overflow-hidden">
        <div className="col-span-3 flex items-center justify-center">
          <div className="relative w-[30rem] h-[30rem] flex items-center justify-center">
            {renderRingButton('Offensive', 270, 'ATTACK')}
            {renderRingButton('Defensive', 0, 'DEFEND')}
            {renderRingButton('Restorative', 90, 'TECH')}
            {renderRingButton('Items', 180, 'ITEM')}

            <div className="absolute inset-0 rounded-full border border-gray-800 pointer-events-none scale-75" />

            <div className="absolute z-20 w-64 h-64 bg-black/95 rounded-full border-4 border-cyan-500/50 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              {!activeCategory && !selectedAction && (
                <div className="text-center">
                  <div className="text-4xl text-cyan-600">⌖</div>
                  <p className="text-xs text-cyan-400 mt-2 font-mono uppercase tracking-widest">SYSTEM READY</p>
                </div>
              )}

              {activeCategory && !selectedAction && (
                <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar flex flex-col">
                  <h3 className="text-center font-bold border-b border-gray-700 mb-2 text-sm uppercase text-cyan-300">
                    {activeCategory} Protocols
                  </h3>
                  <div className="space-y-1 flex-1">
                    {actionsForCategory.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          if (action.targetType === 'self') execute(action);
                          else setSelectedAction(action);
                        }}
                        className="w-full text-left text-xs py-2 px-3 hover:bg-cyan-900/50 text-gray-300 hover:text-white transition-colors rounded border border-transparent hover:border-cyan-500/30"
                      >
                        {action.label}
                        <span className="float-right text-[9px] text-gray-500">{action.ap ? `${action.ap} AP` : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAction && (
                <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar flex flex-col bg-gray-900">
                  <div className="flex justify-between items-center border-b border-red-500/30 mb-2 pb-1">
                    <span className="text-red-400 font-bold text-xs uppercase truncate w-3/4">{selectedAction.label}</span>
                    <button
                      onClick={() => setSelectedAction(null)}
                      className="text-gray-400 hover:text-white text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2 text-center">- SELECT TARGET -</p>
                  <div className="space-y-1">
                    {targetsForAction.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => execute(selectedAction, t)}
                        className="w-full text-left text-xs py-2 px-2 hover:bg-red-900/40 text-gray-200 hover:text-white transition-colors rounded border-l-2 border-transparent hover:border-red-500"
                      >
                        <div className="flex justify-between">
                          <span>{t.name}</span>
                          <span className={t.hp.current / t.hp.max < 0.5 ? 'text-red-400' : 'text-green-400'}>
                            {Math.round((t.hp.current / t.hp.max) * 100)}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
          <div className="border border-neutral-800 bg-black/30 rounded p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Allies</div>
            <div className="space-y-1 text-xs">
              {ALLIES.map((a) => (
                <div key={a.id} className="flex justify-between">
                  <span>{a.name}</span>
                  <span className="text-neutral-500">
                    HP {a.hp.current}/{a.hp.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-neutral-800 bg-black/30 rounded p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Enemies</div>
            <div className="space-y-1 text-xs">
              {ENEMIES.map((e) => (
                <div key={e.id} className="flex justify-between">
                  <span>{e.name}</span>
                  <span className="text-neutral-500">
                    HP {e.hp.current}/{e.hp.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-neutral-800 bg-black/30 rounded p-3 flex-1 overflow-hidden">
            <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2">Log</div>
            <div className="text-xs text-neutral-300 space-y-1 overflow-y-auto custom-scrollbar h-full">
              {log.length === 0 ? (
                <div className="text-neutral-500 italic">No actions executed yet.</div>
              ) : (
                log.map((l, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-1">
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
