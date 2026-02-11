// components/ui/Terminal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../../types';

interface TerminalProps {
  logs: LogEntry[];
  isBusy: boolean;
  onChatSubmit: (msg: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ logs, isBusy, onChatSubmit }) => {
  const [chatInput, setChatInput] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isBusy) return;
      onChatSubmit(chatInput);
      setChatInput("");
  };

  const getLogColor = (type: LogEntry['type']) => {
      switch(type) {
          case 'error': return 'text-red-400';
          case 'success': return 'text-green-400';
          case 'user': return 'text-cyan-300';
          case 'ai': return 'text-purple-300';
          default: return 'text-white/60';
      }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black/40 border border-white/10 rounded overflow-hidden">
        {/* Log Output */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 font-mono text-[10px]">
            {logs.map((log) => (
                <div key={log.id} className={`${getLogColor(log.type)} break-words leading-tight`}>
                    <span className="opacity-30 mr-2">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                    {log.type === 'user' && <span className="text-cyan-500 font-bold">{'> '}</span>}
                    {log.type === 'ai' && <span className="text-purple-500 font-bold">{'AI: '}</span>}
                    {log.message}
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="p-2 border-t border-white/10 bg-black/60 flex gap-2">
            <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isBusy ? "System Busy..." : "Type to refine active generation..."}
            disabled={isBusy}
            className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-white/20 font-mono"
            />
            <button 
            type="submit" 
            disabled={isBusy || !chatInput.trim()}
            className="text-cyan-500 hover:text-cyan-400 disabled:opacity-30 text-xs font-bold uppercase"
            >
            SEND
            </button>
        </form>
    </div>
  );
};

export default Terminal;
