
import React, { useRef, useCallback } from 'react';

interface InputConsoleProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
  isProcessing: boolean;
  isLiveActive: boolean;
  onToggleLive: () => void;
}

// Persistent history across renders (survives component lifecycle)
const inputHistory: string[] = [];
const MAX_HISTORY = 50;

export const InputConsole: React.FC<InputConsoleProps> = ({
  value,
  onChange,
  onSubmit,
  onContinue,
  isProcessing,
  isLiveActive,
  onToggleLive,
}) => {
  const canSend = Boolean(value.trim());
  const historyIndexRef = useRef<number>(-1);
  const tempInputRef = useRef<string>('');

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Allow sending even if processing (User Interrupt)
      if (canSend) {
        // Add to history before sending
        if (value.trim() && (inputHistory.length === 0 || inputHistory[inputHistory.length - 1] !== value.trim())) {
          inputHistory.push(value.trim());
          if (inputHistory.length > MAX_HISTORY) inputHistory.shift();
        }
        historyIndexRef.current = -1;
        tempInputRef.current = '';
        onSubmit();
      }
    } else if (e.key === 'ArrowUp') {
      // Navigate back in history
      if (inputHistory.length === 0) return;
      e.preventDefault();

      if (historyIndexRef.current === -1) {
        // Save current input before navigating
        tempInputRef.current = value;
        historyIndexRef.current = inputHistory.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
      }

      onChange(inputHistory[historyIndexRef.current]);
    } else if (e.key === 'ArrowDown') {
      // Navigate forward in history
      if (historyIndexRef.current === -1) return;
      e.preventDefault();

      if (historyIndexRef.current < inputHistory.length - 1) {
        historyIndexRef.current += 1;
        onChange(inputHistory[historyIndexRef.current]);
      } else {
        // Return to the temp input that was being typed
        historyIndexRef.current = -1;
        onChange(tempInputRef.current);
      }
    }
  }, [canSend, value, onChange, onSubmit]);

  return (
    <div className="flex h-full w-full flex-col gap-3 px-3 py-4">
      <label className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Comms Input</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full resize-none rounded-md border border-neutral-800/80 bg-black/30 px-3 py-2 text-sm leading-relaxed text-slate-100 outline-none transition-shadow duration-200 focus:border-white/70 focus:shadow-[0_0_15px_rgba(14,165,233,0.35)] min-h-[120px]"
        placeholder="Send a command, request, or narrative prompt... (↑/↓ for history)"
        onKeyDown={handleKeyDown}
        spellCheck={false}
        rows={5}
      />

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-500">
        <span className="flex-1 text-slate-400">Live transcript: {isLiveActive ? 'ON' : 'OFF'}</span>
        <button
          type="button"
          onClick={onToggleLive}
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition ${isLiveActive
            ? 'border-sky-400 bg-sky-500/20 text-sky-100'
            : 'border-neutral-700 bg-neutral-900 text-slate-400'
            }`}
        >
          LIVE
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={isProcessing}
          className="flex-1 rounded-md border border-emerald-500/70 bg-emerald-600/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          CONTINUE
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          className={`flex-1 rounded-md border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] transition disabled:cursor-not-allowed disabled:opacity-40 
            ${isProcessing
              ? 'border-yellow-500/80 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20'
              : 'border-cyan-500/80 bg-cyan-500/20 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/50'
            }`}
        >
          {isProcessing ? 'SEND (BUSY)' : 'SEND'}
        </button>
      </div>
    </div>
  );
};
