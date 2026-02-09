import React from 'react';
import type { ChatTarget } from './ChatLog';

interface NpcInScene {
  id: string;
  name: string;
  shortName?: string; // 3-4 char display name
}

interface CommandDeckProps {
  selectedTargets: ChatTarget[];
  onToggleTarget: (target: ChatTarget) => void;
  onAction?: (id: 'status' | 'sync' | 'recall') => void;
  disabled?: boolean;
  // New: NPCs currently in scene
  npcsInScene?: NpcInScene[];
  onNpcInteract?: (npcId: string) => void;
}

const QUICK_ACTIONS: Array<{ id: 'status' | 'sync' | 'recall'; label: string; sublabel: string }> = [
  { id: 'status', label: 'STATUS', sublabel: 'Pulse sensors' },
  { id: 'sync', label: 'SYNC', sublabel: 'Refresh memory' },
  { id: 'recall', label: 'RECALL', sublabel: 'Replay log' },
];

const CHANNELS: Array<{ target: ChatTarget; label: string; helper: string }> = [
  { target: 'navbot', label: 'NAV', helper: 'Routing / helm' },
  { target: 'vizzy', label: 'VIZ', helper: 'Sensor / visuals' },
  { target: 'lyra', label: 'LYR', helper: 'Narrative / GM' },
];

export const CommandDeck: React.FC<CommandDeckProps> = ({
  selectedTargets,
  onToggleTarget,
  onAction,
  disabled,
  npcsInScene = [],
  onNpcInteract
}) => {
  // Always show 3 NPC slots (with placeholders "<----->" if empty)
  const npcSlots = [0, 1, 2].map(i => npcsInScene[i] || null);

  return (
    <div className="grid grid-cols-6 gap-2 h-full p-2">
      {/* Left 3 Slots: NPC Interaction Buttons */}
      {npcSlots.map((npc, i) => (
        <button
          key={npc?.id || `slot-${i}`}
          type="button"
          onClick={() => npc && !disabled && onNpcInteract?.(npc.id)}
          disabled={disabled || !npc}
          title={npc ? `Talk to ${npc.name}` : 'No NPC in range'}
          className={`flex flex-col items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${npc
            ? 'border-amber-500/60 bg-amber-900/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:border-amber-400 hover:bg-amber-800/30 hover:text-white'
            : 'border-neutral-700/40 bg-neutral-950/50 text-neutral-500 cursor-not-allowed'
            } disabled:opacity-60`}
        >
          <span className="text-[10px]">
            {npc ? (npc.shortName || npc.name.slice(0, 5).toUpperCase()) : '<----->'}
          </span>
          <span className={`mt-0.5 text-[7px] tracking-[0.2em] truncate max-w-full ${npc ? 'text-amber-400/70' : 'text-neutral-600'}`}>
            {npc ? 'NPC' : 'EMPTY'}
          </span>
        </button>
      ))}

      {/* Right 3 Slots: Chat Target Channels (NAV/VIZ/LYR) */}
      {CHANNELS.map((channel) => {
        const isActive = selectedTargets.includes(channel.target);
        return (
          <button
            key={channel.target}
            type="button"
            onClick={() => !disabled && onToggleTarget(channel.target)}
            disabled={disabled}
            title={channel.helper}
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${isActive
              ? 'border-cyan-400/90 bg-cyan-400/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.45)]'
              : 'border-neutral-800 bg-neutral-950 text-slate-400 hover:border-white/50 hover:text-white'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {channel.label}
          </button>
        );
      })}
    </div>
  );
};
