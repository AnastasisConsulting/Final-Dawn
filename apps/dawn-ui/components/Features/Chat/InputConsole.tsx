/**
 * UI STABILITY WARNING: 
 * This component is part of the established "High-Density / Professional Sleek" UI standard.
 * DO NOT modify the console height (min-h-[50px]), padding (p-2), or font sizes (text-[11px]).
 */
import React, { useRef, useCallback } from 'react';

interface InputConsoleProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  disabled?: boolean;
  onContinue?: () => void;
  placeholder?: string;
}

const inputHistory: string[] = [];
const MAX_HISTORY = 50;

export const InputConsole: React.FC<InputConsoleProps> = ({
  value,
  onChange,
  onSend,
  disabled,
  onContinue,
  placeholder = "ENTER NEURAL COMMAND..."
}) => {
  const historyIndexRef = useRef<number>(-1);
  const tempInputRef = useRef<string>('');

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        if (inputHistory.length === 0 || inputHistory[inputHistory.length - 1] !== value.trim()) {
          inputHistory.push(value.trim());
          if (inputHistory.length > MAX_HISTORY) inputHistory.shift();
        }
        historyIndexRef.current = -1;
        tempInputRef.current = '';
        onSend(value);
      }
    } else if (e.key === 'ArrowUp') {
      if (inputHistory.length === 0) return;
      e.preventDefault();
      if (historyIndexRef.current === -1) {
        tempInputRef.current = value;
        historyIndexRef.current = inputHistory.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
      }
      onChange(inputHistory[historyIndexRef.current]);
    } else if (e.key === 'ArrowDown') {
      if (historyIndexRef.current === -1) return;
      e.preventDefault();
      if (historyIndexRef.current < inputHistory.length - 1) {
        historyIndexRef.current += 1;
        onChange(inputHistory[historyIndexRef.current]);
      } else {
        historyIndexRef.current = -1;
        onChange(tempInputRef.current);
      }
    }
  }, [value, onChange, onSend]);

  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full min-h-[50px] bg-black/60 border border-white/5 p-2 text-[11px] text-cyan-50/90 placeholder:text-white/10 outline-none transition-all focus:border-cyan-500/30 focus:bg-black/80 custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={placeholder}
          spellCheck={false}
        />
        <div className="absolute bottom-1 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] text-white/10 uppercase tracking-[0.2em]">Enter to Send</span>
        </div>
      </div>

      <div className="flex gap-1.5 text-[9px]">
        <button
          onClick={() => onSend(value)}
          disabled={disabled || !value.trim()}
          className="flex-1 h-8 bg-cyan-500/5 border border-cyan-500/10 text-cyan-500/80 uppercase tracking-[0.2em] font-bold hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all disabled:opacity-50"
        >
          Dispatch Signal
        </button>
        {onContinue && (
          <button
            onClick={onContinue}
            disabled={disabled}
            className="flex-1 h-8 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/80 uppercase tracking-[0.2em] font-bold hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-50"
          >
            Continuity
          </button>
        )}
      </div>
    </div>
  );
};
