import React from 'react';
import { AlertTriangle, Cpu, Zap, Crosshair, Brain, Terminal, Activity, Shield, Scale, BarChart3, GitBranch } from 'lucide-react';
import { Incident, LogEntry, CityStats, SystemMode, SeCuredModuleId } from '../types';
import { HeaderStats, EnvWidget, OrchestrationVisualizer, HierarchyVisualizer, ModuleManager, AuditPanel } from './HUDModules';

interface InterfaceProps {
  stats: CityStats;
  logs: LogEntry[];
  activeIncident: Incident | null;
  onResolve: () => void;
  mode: SystemMode;
  toggleMode: () => void;
  toggleModule: (id: SeCuredModuleId) => void;
}

export const Interface: React.FC<InterfaceProps> = ({ stats, logs, activeIncident, onResolve, mode, toggleMode, toggleModule }) => {
  const isSiege = mode === 'SIEGE';
  const themeColor = isSiege ? "text-red-500" : "text-cyan-400";
  const bgTheme = isSiege ? "bg-red-950/80" : "bg-slate-900/80";
  const borderTheme = isSiege ? "border-red-500/50" : "border-cyan-500/30";

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col p-4 z-10 font-sans h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start mb-4">
        <div className={`${bgTheme} backdrop-blur-md border ${borderTheme} p-3 rounded-lg shadow-lg pointer-events-auto min-w-[400px]`}>
          <h1 className={`text-2xl font-bold text-white flex items-center gap-3`}>
            {isSiege ? <AlertTriangle className="text-red-500 animate-pulse" /> : <Brain className="text-cyan-400" />}
            SENTIENT CORE <span className="text-xs opacity-50 font-mono mt-1">v7.0 [AUDITED]</span>
          </h1>
          <HeaderStats stats={stats} isSiege={isSiege} />
        </div>

        <EnvWidget stats={stats} />

        <div className="flex gap-2 pointer-events-auto">
           <button 
            onClick={toggleMode}
            className={`px-4 py-2 rounded-lg border font-bold text-xs tracking-widest transition-all hover:scale-105 flex items-center gap-2
              ${isSiege 
                ? "bg-red-950 border-red-500 text-red-500 hover:bg-red-900 shadow-[0_0_20px_rgba(220,38,38,0.5)]" 
                : "bg-slate-900 border-cyan-500 text-cyan-400 hover:bg-slate-800"
              }`}
          >
            <Zap size={16} />
            {isSiege ? "DEACTIVATE SURVIVAL" : "INITIATE SIEGE"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* --- LEFT: ORCHESTRATION --- */}
        <div className="w-1/4 flex flex-col gap-4">
          <div className={`${bgTheme} backdrop-blur-md border ${borderTheme} flex-1 rounded-lg p-4 pointer-events-auto flex flex-col transition-all duration-300`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <h3 className={`font-bold ${themeColor} flex items-center gap-2`}>
                <Crosshair size={16} /> ACTIVE THREAD
              </h3>
              {activeIncident && <span className="text-xs font-mono text-slate-400">ID: {activeIncident.id}</span>}
            </div>

            {activeIncident ? (
              <div className="flex flex-col gap-4 h-full">
                <div className="space-y-1">
                  <div className={`text-xl font-bold uppercase ${isSiege ? 'text-red-400' : 'text-cyan-200'}`}>
                    {activeIncident.isSimulation ? "[SIM]" : ""} {activeIncident.type}
                  </div>
                  <div className="text-xs font-bold tracking-wider text-slate-500">SEVERITY S{activeIncident.severity}</div>
                  
                  {activeIncident.scalarFactor && (
                    <div className="mt-2 bg-red-900/30 border border-red-500/50 p-2 rounded flex items-center gap-2 text-xs text-red-300 font-bold animate-pulse">
                      <AlertTriangle size={12} /> SCALAR: {activeIncident.scalarFactor}
                    </div>
                  )}
                  {activeIncident.overriddenByParent && (
                    <div className="mt-2 bg-purple-900/30 border border-purple-500/50 p-2 rounded flex items-center gap-2 text-xs text-purple-300 font-bold animate-pulse">
                      <Shield size={12} /> PARENT AI OVERRIDE ACTIVE
                    </div>
                  )}
                  <p className="text-sm text-slate-300 font-mono leading-tight mt-2">{activeIncident.description}</p>
                </div>

                <OrchestrationVisualizer incident={activeIncident} isSiege={isSiege} />

                {mode === 'NORMAL' && activeIncident.orchestrationStage === 'EXECUTION' && (
                  <button onClick={onResolve} className="mt-auto bg-cyan-600/20 border border-cyan-500 hover:bg-cyan-600 hover:text-white text-cyan-400 py-2 rounded text-sm font-bold transition-all">
                    CONFIRM RESOLUTION
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm font-mono gap-4">
                <Brain size={48} className={`opacity-20 ${stats.circadianPhase === 'REM' ? "animate-pulse text-purple-500" : ""}`} />
                {stats.circadianPhase === 'REM' ? "DREAMING // SIMULATION ACTIVE" : "AWAITING SENSORY INPUT..."}
              </div>
            )}
          </div>
        </div>

        {/* --- CENTER: SPACE --- */}
        <div className="flex-1"></div>

        {/* --- RIGHT: DATA & LOGS --- */}
        <div className="w-1/4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
             <StatBox label="SAFETY" value={`${stats.safetyScore}%`} color={stats.safetyScore > 80 ? "text-emerald-400" : "text-amber-400"} isSiege={isSiege} />
             <StatBox label="ETHICS" value={`${stats.ethicalAlignment}%`} color={stats.ethicalAlignment > 90 ? "text-emerald-400" : "text-yellow-400"} isSiege={isSiege} icon={<Scale size={14}/>} />
             <StatBox label="THREAT" value={`${stats.threatLevel || 0}%`} color={isSiege ? "text-red-500" : "text-slate-600"} isSiege={isSiege} />
             <StatBox label="EFFICIENCY" value={`${stats.efficiency}%`} color="text-purple-400" isSiege={isSiege} />
          </div>

          <div className="flex flex-col gap-4 pointer-events-auto h-full overflow-y-auto pr-2">
             <ModuleManager modules={stats.securedModules} onToggle={toggleModule} />
             <HierarchyVisualizer modules={stats.aiModules} />
             <AuditPanel reports={stats.recentAudits} />
          </div>

          {/* Log Terminal */}
          <div className={`${bgTheme} backdrop-blur-md border ${borderTheme} flex-1 rounded-lg p-3 overflow-hidden flex flex-col pointer-events-auto shadow-lg min-h-[150px]`}>
            <h3 className={`${themeColor} font-bold text-xs flex items-center gap-2 mb-2 border-b border-white/10 pb-2`}>
              <Terminal size={14} /> NEURAL LOG
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px]">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 opacity-90 hover:opacity-100 transition-opacity leading-tight">
                  <span className="text-slate-600 w-12 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold w-16 shrink-0 ${getModuleColor(log.module)}`}>{log.module}</span>
                  <span className={`break-words ${getLogColor(log.type)}`}>
                    {log.type === 'encrypted' ? '****** ENCRYPTED THOUGHT STREAM ******' : log.message}
                  </span>
                </div>
              ))}
              <div id="log-end" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color, isSiege, icon }: any) => (
  <div className={`${isSiege ? "bg-red-950/50 border-red-500/30" : "bg-slate-900/50 border-slate-700"} border backdrop-blur p-2 rounded flex flex-col justify-between`}>
    <div className="text-[10px] text-slate-500 tracking-wider font-bold flex items-center gap-1">{icon} {label}</div>
    <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
  </div>
);

const getModuleColor = (module: LogEntry['module']) => {
  switch (module) {
    case 'IOT': return 'text-emerald-400';
    case 'CV': return 'text-purple-400';
    case 'NLP': return 'text-amber-400';
    case 'PREDICTIVE': return 'text-blue-400';
    case 'RESOURCE': return 'text-pink-400';
    case 'DEFENSE': return 'text-red-500 font-bold';
    case 'INTEL': return 'text-emerald-500';
    case 'CORTEX': return 'text-indigo-400';
    case 'ETHICS': return 'text-yellow-400';
    case 'REGISTRY': return 'text-slate-200';
    case 'ENV': return 'text-amber-200';
    case 'PARENT_AI': return 'text-purple-300 font-bold';
    case 'FAILOVER': return 'text-orange-400 font-bold';
    case 'PRISM': return 'text-indigo-300 font-bold';
    case 'PUBLIC': return 'text-blue-300';
    case 'CFC': return 'text-cyan-200';
    case 'FSM': return 'text-pink-300';
    case 'OTA': return 'text-green-300';
    case 'AUDIT': return 'text-slate-100 font-bold bg-slate-700 px-1 rounded';
    default: return 'text-slate-400';
  }
};

const getLogColor = (type: LogEntry['type']) => {
  switch (type) {
    case 'critical': return 'text-red-400 font-bold';
    case 'warning': return 'text-amber-300';
    case 'success': return 'text-emerald-300';
    case 'tactical': return 'text-cyan-300 italic';
    case 'audit': return 'text-white font-bold tracking-wide';
    case 'encrypted': return 'text-slate-600 italic tracking-widest';
    default: return 'text-slate-300';
  }
};