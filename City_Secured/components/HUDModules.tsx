import React from 'react';
import { Incident, LogEntry, OrchestrationStage, AIModuleState, SeCuredModule, SeCuredModuleId, AuditReport } from '../types';
import { ORCHESTRATION_STEPS } from '../constants';
import { Brain, Lock, RefreshCw, Thermometer, CloudRain, Wind, AlertTriangle, Network, ShieldAlert, Zap, CornerDownRight, Box, Check, X, FileText, ShieldCheck, AlertOctagon } from 'lucide-react';

export const HeaderStats = ({ stats, isSiege }: any) => (
  <div className="flex justify-between items-start">
    <div>
      <div className="flex gap-4 mt-2 text-xs font-mono">
        <div className={`flex items-center gap-1 ${stats.circadianPhase === 'WAKE' ? 'text-amber-300' : 'text-blue-300'} font-bold tracking-wider`}>
          <RefreshCw size={12} className={stats.circadianPhase === 'WAKE' ? "animate-spin" : ""} /> 
          PHASE: {stats.circadianPhase}
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Lock size={12} className={stats.registryIntegrity < 100 ? "text-red-500" : "text-emerald-400"} /> 
          REGISTRY: <span className={stats.registryIntegrity < 100 ? "text-red-400" : "text-emerald-400"}>{stats.registryIntegrity}%</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-1 w-24">
      <MemoryBar label="STM" value={stats.memoryUsage.short} color="bg-cyan-500" />
      <MemoryBar label="LTM" value={stats.memoryUsage.long} color="bg-blue-600" />
      <MemoryBar label="CACHE" value={stats.memoryUsage.cache} color="bg-purple-500" />
    </div>
  </div>
);

export const MemoryBar = ({ label, value, color }: any) => (
  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
    <span className="w-8 text-right">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export const EnvWidget = ({ stats }: any) => (
  <div className="bg-slate-900/80 border border-slate-700 p-2 rounded-lg shadow-lg flex items-center gap-4 px-4 min-w-[150px]">
     <div className="text-center w-full">
       <div className="text-[10px] text-slate-400 font-bold tracking-wider">ENV. SCALAR</div>
       <div className="text-lg font-bold text-white flex items-center justify-center gap-2 my-1">
         {stats.weather === 'HEATWAVE' ? <Thermometer className="text-red-500" size={18} /> : 
          stats.weather === 'ICESTORM' ? <CloudRain className="text-cyan-200" size={18} /> :
          stats.weather === 'WINDY' ? <Wind className="text-slate-300" size={18} /> :
          <span className="text-emerald-400 text-xs">NOMINAL</span>}
         {stats.temperature}°C
       </div>
       <div className="text-[10px] font-mono text-slate-300 bg-white/5 rounded px-1">
         GRID: <span className={stats.weather === 'HEATWAVE' ? "text-red-400" : "text-emerald-400"}>{stats.weather === 'HEATWAVE' ? 'CRITICAL' : 'STABLE'}</span>
       </div>
     </div>
  </div>
);

export const OrchestrationVisualizer = ({ incident, isSiege }: { incident: Incident, isSiege: boolean }) => (
  <div className="flex-1 flex flex-col justify-center py-4 space-y-2">
    <div className="text-xs text-slate-500 font-mono uppercase border-b border-white/5 mb-2">Cognitive Pipeline</div>
    {ORCHESTRATION_STEPS.map((step, index) => {
      const isActive = incident.orchestrationStage === step.id;
      const isPast = ORCHESTRATION_STEPS.findIndex(s => s.id === incident.orchestrationStage) > index;
      
      return (
        <div key={step.id} className="flex items-center gap-3">
          <div className={`w-1 h-full ${isActive || isPast ? (isSiege ? 'bg-red-500' : 'bg-cyan-500') : 'bg-slate-700'}`} />
          <div className={`w-3 h-3 rounded-full border flex items-center justify-center text-[6px]
            ${isActive ? (isSiege ? 'border-red-500 bg-red-900' : 'border-cyan-400 bg-cyan-900') : 
              isPast ? (isSiege ? 'bg-red-900 border-red-900' : 'bg-cyan-900 border-cyan-900') : 
              'border-slate-700 bg-slate-900'}`}>
          </div>
          <div className="flex-1">
            <div className={`text-[10px] font-bold ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-600'}`}>
              {step.label}
            </div>
            {isActive && (
              <div className="w-full h-0.5 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${isSiege ? 'bg-red-500' : 'bg-cyan-500'}`} 
                  style={{width: `${incident.orchestrationProgress}%`}}
                />
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const ModuleRow = ({ mod }: { mod: AIModuleState }) => (
  <div className="flex items-center gap-2">
    {mod.level === 'SUBMODEL' && <div className="pl-3"><CornerDownRight size={10} className="text-slate-600"/></div>}
    
    <div className={`w-2 h-2 rounded-full ${
      mod.status === 'ACTIVE' ? 'bg-emerald-500' : 
      mod.status === 'FAILOVER' ? 'bg-amber-500 animate-pulse' : 
      mod.status === 'OVERRIDDEN' ? 'bg-red-500 animate-bounce' : 
      mod.status === 'BOOSTED' ? 'bg-purple-500 animate-pulse' :
      mod.status === 'THROTTLED' ? 'bg-slate-500' :
      'bg-slate-600'
    }`} />
    
    <div className="flex-1">
      <div className="flex justify-between items-baseline">
        <span className={`text-[10px] font-bold ${mod.level === 'PARENT' ? 'text-white' : 'text-slate-300'}`}>{mod.name}</span>
        <span className={`text-[9px] font-mono ${
          mod.status === 'ACTIVE' ? 'text-emerald-400' : 
          mod.status === 'FAILOVER' ? 'text-amber-400' : 
          mod.status === 'OVERRIDDEN' ? 'text-red-400' :
          mod.status === 'BOOSTED' ? 'text-purple-400' :
          'text-slate-500'
        }`}>{mod.status}</span>
      </div>
      <div className="flex justify-between items-baseline">
         <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
           {mod.status === 'BOOSTED' && <Zap size={8} />} {mod.activeTask}
         </span>
         <div className="w-8 h-0.5 bg-slate-700 mt-1">
           <div 
             className={`h-full ${mod.status === 'BOOSTED' ? 'bg-purple-500' : mod.status === 'THROTTLED' ? 'bg-slate-500' : 'bg-emerald-500'}`} 
             style={{width: `${Math.min(100, mod.efficiency)}%`}} 
           />
         </div>
      </div>
    </div>
  </div>
);

export const HierarchyVisualizer = ({ modules }: { modules: AIModuleState[] }) => {
  const sortedModules = [...modules].sort((a, b) => {
    if(a.level === 'PARENT') return -1;
    if(b.level === 'PARENT') return 1;
    const aGroup = a.parentId || a.id;
    const bGroup = b.parentId || b.id;
    if (aGroup !== bGroup) return aGroup.localeCompare(bGroup);
    if (a.id === aGroup) return -1;
    if (b.id === bGroup) return 1;
    return 0;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg shadow-lg">
      <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
        <Network size={12}/> AI HIERARCHY
      </h4>
      <div className="space-y-1.5">
        {sortedModules.map((mod) => (
          <ModuleRow key={mod.id} mod={mod} />
        ))}
      </div>
    </div>
  );
};

export const ModuleManager = ({ modules, onToggle }: { modules: SeCuredModule[], onToggle: (id: SeCuredModuleId) => void }) => (
  <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg shadow-lg">
    <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
      <Box size={12}/> SECURED MODULES
    </h4>
    <div className="grid grid-cols-2 gap-2">
      {modules.map((mod) => (
        <button 
          key={mod.id} 
          onClick={() => onToggle(mod.id)}
          disabled={mod.isLocked}
          className={`p-2 rounded border text-left transition-all ${
            mod.isActive 
              ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-900/50' 
              : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
          } ${mod.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[10px] font-bold ${mod.isActive ? 'text-emerald-400' : 'text-slate-400'}`}>{mod.name}</span>
            {mod.isActive ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-slate-500" />}
          </div>
          <div className="text-[8px] text-slate-500 leading-tight">{mod.description}</div>
        </button>
      ))}
    </div>
  </div>
);

export const AuditPanel = ({ reports }: { reports: AuditReport[] }) => (
  <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg shadow-lg max-h-[150px] overflow-hidden flex flex-col">
    <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
      <ShieldCheck size={12}/> AUDIT LOGS
    </h4>
    <div className="flex-1 overflow-y-auto space-y-2">
      {reports.map((report) => (
        <div key={report.id} className="flex gap-2 items-start border-b border-white/5 pb-1">
          <div className={`p-1 rounded ${report.status === 'PASS' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {report.status === 'PASS' ? <Check size={10} /> : <AlertOctagon size={10} />}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-white">{report.type} REPORT</span>
                <span className="text-[8px] text-slate-500">{new Date(report.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-[9px] text-slate-400 leading-tight">{report.summary}</div>
          </div>
        </div>
      ))}
      {reports.length === 0 && <div className="text-[10px] text-slate-600 text-center italic">No audit reports generated yet.</div>}
    </div>
  </div>
);