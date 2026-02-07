import React from 'react';
import type { ChatTarget } from './ChatLog';

interface CommandDeckProps {
  selectedTargets: ChatTarget[];
  onToggleTarget: (target: ChatTarget) => void;
  onAction?: (id: 'status' | 'sync' | 'recall') => void;
  disabled?: boolean;
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

export const CommandDeck: React.FC<CommandDeckProps> = ({ selectedTargets, onToggleTarget, onAction, disabled }) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => !disabled && onAction?.(action.id)}
          disabled={disabled}
          className="flex flex-col items-center justify-center rounded-md border border-neutral-800/70 bg-[#020612] px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-200 shadow-[0_0_15px_rgba(56,189,248,0.25)] transition hover:border-cyan-400/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{action.label}</span>
          <span className="mt-1 text-[8px] tracking-[0.4em] text-slate-400">{action.sublabel}</span>
        </button>
      ))}

      {CHANNELS.map((channel) => {
        const isActive = selectedTargets.includes(channel.target);
        return (
          <button
            key={channel.target}
            type="button"
            onClick={() => !disabled && onToggleTarget(channel.target)}
            disabled={disabled}
            title={channel.helper}
            className={`rounded-md border px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.45em] transition ${
              isActive
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
