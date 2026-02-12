// components/ui/GenerationMonitor.tsx
import React, { useEffect, useRef } from 'react';
import { LogEntry, GenerationStatus } from '../../types';

interface GenerationMonitorProps {
  logs: LogEntry[];
  status: GenerationStatus;
}

const GenerationMonitor: React.FC<GenerationMonitorProps> = ({ logs, status }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full md:w-3/4 border-l border-white/10 bg-black/80 flex flex-col font-mono relative overflow-hidden rounded-r-lg">
        {/* Retro CRT Scanline Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white/5 to-transparent h-32" />

        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-20 backdrop-blur-sm">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                SYSTEM TERMINAL // PROCESSING TASK
            </h2>
            <div className="text-[10px] text-white/40 font-mono border border-white/10 px-2 py-1 rounded">
                STATUS: {status}
            </div>
        </div>

        {/* Log Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 z-20 custom-scrollbar font-mono text-sm bg-black/40">
            {logs.length === 0 && (
                <div className="text-cyan-500/50 italic animate-pulse">Initializing neural link...</div>
            )}
            
            {logs.map((log) => (
                <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-300 border-l-2 border-transparent hover:border-white/10 pl-2">
                    <div className="flex items-baseline gap-3">
                        <span className="text-white/20 text-[10px] min-w-[60px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                        </span>
                        <div className="flex-1 break-words">
                            <span className={`font-bold mr-2 ${
                                log.type === 'error' ? 'text-red-500' : 
                                log.type === 'success' ? 'text-green-400' : 
                                log.type === 'ai' ? 'text-purple-400' : 
                                log.type === 'user' ? 'text-cyan-300' : 'text-cyan-600'
                            }`}>
                                {log.type === 'user' ? 'USER >>' : log.type === 'ai' ? 'AI >>' : 'SYS >>'}
                            </span>
                            <span className={`${
                                log.type === 'error' ? 'text-red-400' : 
                                log.type === 'success' ? 'text-green-300' : 'text-white/80'
                            }`}>
                                {log.message}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            
            <div ref={bottomRef} />
            
            {/* Active Cursor Line */}
            <div className="flex items-center gap-2 mt-4 text-cyan-500">
                <span>_</span>
                <span className="h-4 w-2 bg-cyan-500 animate-pulse"></span>
            </div>
        </div>
    </div>
  );
};

export default GenerationMonitor;
