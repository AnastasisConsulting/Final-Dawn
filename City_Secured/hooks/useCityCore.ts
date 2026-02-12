import { useState, useEffect } from 'react';
import { Incident, LogEntry, CityStats, SystemMode, IncidentType, WeatherCondition, OrchestrationStage, CircadianState, SeCuredModuleId, AuditReport } from '../types';
import { generateRandomIncident } from '../utils/incidentLogic';
import { INITIAL_MODULES, checkConflicts, checkFailover } from '../utils/aiHierarchyLogic';
import { COGNITIVE_LOG_MESSAGES, INITIAL_SECURED_MODULES } from '../constants';

export const useCityCore = () => {
  const [mode, setMode] = useState<SystemMode>('NORMAL');
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [stats, setStats] = useState<CityStats>({
    safetyScore: 98,
    activeUnits: 12,
    efficiency: 94,
    airQuality: 42,
    intelGathered: 0,
    threatLevel: 0,
    cpuLoad: 24,
    networkLatency: 12,
    memoryUsage: { short: 15, long: 45, cache: 5 },
    ethicalAlignment: 99,
    registryIntegrity: 100,
    circadianPhase: 'WAKE',
    temperature: 24,
    weather: 'CLEAR',
    aiModules: INITIAL_MODULES,
    securedModules: INITIAL_SECURED_MODULES,
    recentAudits: []
  });

  const addLog = (module: LogEntry['module'], message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      module,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-25), newLog]); // Increased log buffer
  };

  const toggleMode = () => {
    const newMode = mode === 'NORMAL' ? 'SIEGE' : 'NORMAL';
    setMode(newMode);
    
    if (newMode === 'SIEGE') {
      addLog('DEFENSE', 'SURVIVAL INSTINCT TRIGGERED.', 'critical');
      addLog('REGISTRY', 'Immutable Registry LOCKED. Read-only mode.', 'critical');
      setStats(prev => ({ 
        ...prev, threatLevel: 75, activeUnits: 0, intelGathered: 0,
        circadianPhase: 'WAKE', memoryUsage: { short: 100, long: prev.memoryUsage.long, cache: 0 }
      }));
    } else {
      addLog('CORE', 'Returning to homeostasis.', 'success');
      setStats(prev => ({ ...prev, threatLevel: 0, memoryUsage: { short: 20, long: prev.memoryUsage.long, cache: 5 } }));
    }
    setActiveIncident(null);
  };

  const toggleModule = (id: SeCuredModuleId) => {
    setStats(prev => {
        const updated = prev.securedModules.map(m => {
            if (m.id === id && !m.isLocked) {
                const newState = !m.isActive;
                addLog('CORE', `Module ${m.name} ${newState ? 'INITIALIZED' : 'DEACTIVATED'}.`, newState ? 'success' : 'warning');
                return { ...m, isActive: newState };
            }
            return m;
        });
        return { ...prev, securedModules: updated };
    });
  };

  const resolveIncident = () => {
    if (!activeIncident) return;
    addLog('RESOURCE', 'Incident resolved. Resources returning to standby.', 'success');
    setActiveIncident(null);
    setStats(prev => ({
        ...prev,
        aiModules: prev.aiModules.map(m => m.status === 'OVERRIDDEN' ? { ...m, status: 'ACTIVE', activeTask: 'Restored' } : m)
    }));
  };

  // --- AUDITING ENGINE ---
  // Generates CFC/FSM/OTA logs and performs routine audits
  useEffect(() => {
    const auditInterval = setInterval(() => {
        const rand = Math.random();
        
        // CFC Log (Critical Function Call)
        if (rand > 0.7) {
            addLog('CFC', `Function Exec: Optim_Route_${Math.floor(Math.random()*1000)} [Latency: ${Math.floor(Math.random()*10)}ms]`, 'info');
        }
        // FSM Log (Failover Sub-Module)
        else if (rand > 0.9) {
            addLog('FSM', 'Anomaly Scan Complete. No deviations detected.', 'success');
        }
        // OTA Log (Over The Air Update)
        else if (rand < 0.05) {
            addLog('OTA', 'Patch v6.5.2 verified. Applying update to edge nodes...', 'warning');
        }

        // Random Manual Query (Simulated)
        if (Math.random() > 0.95) {
            addLog('AUDIT', 'Random Query: Inspecting Resource Module Integrity...', 'audit');
            setTimeout(() => addLog('AUDIT', 'Query Result: PASS. Hash matched off-site ledger.', 'success'), 1500);
        }

    }, 3000);

    // Daily Audit Report (Simulated every 60s)
    const reportInterval = setInterval(() => {
        const report: AuditReport = {
            id: Math.random().toString(36).substr(2,6),
            type: 'DAILY',
            timestamp: Date.now(),
            summary: `Daily Sys Check: All modules nominal.`,
            status: Math.random() > 0.1 ? 'PASS' : 'FLAGGED'
        };
        setStats(prev => ({ ...prev, recentAudits: [report, ...prev.recentAudits.slice(0, 4)] }));
        addLog('AUDIT', `Daily Report Generated [ID: ${report.id}]. Status: ${report.status}`, report.status === 'PASS' ? 'success' : 'critical');
    }, 60000);

    return () => {
        clearInterval(auditInterval);
        clearInterval(reportInterval);
    };
  }, []);

  // --- HIERARCHY FAILOVER CHECKER ---
  useEffect(() => {
    const interval = setInterval(() => {
      const result = checkFailover(stats.aiModules);
      if (result) {
        setStats(prev => ({ ...prev, aiModules: result.updatedModules }));
        if (result.log) addLog(result.log.module, result.log.message, result.log.type);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [stats.aiModules]);

  // --- ENVIRONMENT ENGINE ---
  useEffect(() => {
    const weatherCycle = setInterval(() => {
      if (mode === 'SIEGE') return;
      const rand = Math.random();
      let newWeather: WeatherCondition = 'CLEAR';
      let newTemp = 24;

      if (rand > 0.8) { newWeather = 'HEATWAVE'; newTemp = 38; addLog('ENV', 'Alert: Extreme heat wave.', 'warning'); } 
      else if (rand > 0.6) { newWeather = 'STORM'; newTemp = 18; addLog('ENV', 'Storm front incoming.', 'info'); } 
      else if (rand > 0.5) { newWeather = 'ICESTORM'; newTemp = -5; addLog('ENV', 'Freezing conditions detected.', 'warning'); }

      setStats(prev => ({ ...prev, weather: newWeather, temperature: newTemp }));
    }, 25000);
    return () => clearInterval(weatherCycle);
  }, [mode]);

  // --- CIRCADIAN RHYTHM ---
  useEffect(() => {
    const runCycle = () => {
      if (mode === 'SIEGE') return;
      setStats(prev => {
        let nextPhase: CircadianState = 'WAKE';
        if (prev.circadianPhase === 'WAKE') nextPhase = 'CONSOLIDATION';
        else if (prev.circadianPhase === 'CONSOLIDATION') nextPhase = 'REM';
        
        const msgs = COGNITIVE_LOG_MESSAGES[nextPhase];
        addLog('CORTEX', `Phase Shift: ${nextPhase}`, 'info');
        setTimeout(() => addLog('CORTEX', msgs[Math.floor(Math.random() * msgs.length)], 'tactical'), 800);

        return { ...prev, circadianPhase: nextPhase };
      });
    };
    const interval = setInterval(runCycle, 15000);
    return () => clearInterval(interval);
  }, [mode]);

  // --- INCIDENT SPAWNER ---
  useEffect(() => {
    if (activeIncident && activeIncident.severity > 0) return;
    if (stats.circadianPhase === 'REM' && mode === 'NORMAL' && !activeIncident) {
        const spawnSim = Math.random() > 0.5;
        if(spawnSim) {
             const sim: Incident = {
                id: `SIM-${Math.floor(Math.random() * 100)}`,
                type: IncidentType.SIMULATION,
                position: [0,0,0], severity: 3, status: 'ANALYZING',
                orchestrationStage: 'IMAGINATION', orchestrationProgress: 0,
                timestamp: Date.now(), description: "Imagining Scenario: Utility failure cascade.",
                assignedResources: [], isSimulation: true
             };
             setActiveIncident(sim);
             addLog('CORTEX', 'Running hypothetical scenario...', 'encrypted');
        }
        return;
    }

    const spawnTimer = setTimeout(() => {
        if (Math.random() > 0.6) {
            addLog(mode === 'SIEGE' ? 'INTEL' : 'IOT', "Routine telemetry scan nominal.", 'info');
            return;
        }
        const incident = generateRandomIncident(mode, stats.weather);
        
        const scoringMod = stats.securedModules.find(m => m.id === 'SCORING');
        if (scoringMod?.isActive) {
            incident.description = `[PRISM SCORING APPLIED] ${incident.description}`;
            addLog('PRISM', `Calculating dynamic risk score... P.R.I.S.M. factor: ${Math.random().toFixed(2)}`, 'tactical');
        }

        if (incident.scalarFactor) addLog('ENV', `SCALAR AMPLIFICATION DETECTED: ${incident.scalarFactor}`, 'critical');
        setActiveIncident(incident);
        addLog('IOT', `EVENT DETECTED: ${incident.type}`, 'warning');

    }, Math.random() * 5000 + 3000);
    return () => clearTimeout(spawnTimer);
  }, [activeIncident, mode, stats.circadianPhase, stats.weather, stats.securedModules]);

  // --- ORCHESTRATION PIPELINE ---
  useEffect(() => {
    if (!activeIncident) return;
    const speed = mode === 'SIEGE' ? 600 : 1200;

    const interval = setInterval(() => {
      setActiveIncident(prev => {
        if (!prev) return null;
        let nextProgress = prev.orchestrationProgress + (Math.random() * 15 + 5);
        
        if (nextProgress < 100) return { ...prev, orchestrationProgress: nextProgress };

        let nextStage = prev.orchestrationStage;
        let nextStatus = prev.status;
        let isOverridden = prev.overriddenByParent;
        
        const ethicsMod = stats.securedModules.find(m => m.id === 'ETHICS')?.isActive;
        const publicMod = stats.securedModules.find(m => m.id === 'PUBLIC')?.isActive;
        const responseMod = stats.securedModules.find(m => m.id === 'RESPONSE')?.isActive;

        switch (prev.orchestrationStage) {
            case 'INGESTION': nextStage = 'VERIFICATION'; nextStatus = 'ANALYZING'; break;
            case 'VERIFICATION': nextStage = 'SCALAR_ANALYSIS'; break;
            case 'SCALAR_ANALYSIS': 
                nextStage = 'HIERARCHY_REVIEW'; 
                if(prev.scalarFactor) addLog('CORE', 'Adjusting for Environmental Scalar.', 'warning');
                break;
            case 'HIERARCHY_REVIEW':
                if (responseMod) {
                    const { conflict, resolutionLog, updatedModules } = checkConflicts(prev, stats.aiModules);
                    if (conflict && resolutionLog) {
                        addLog(resolutionLog.module, resolutionLog.message, resolutionLog.type);
                        isOverridden = true;
                        if(updatedModules) setStats(s => ({ ...s, aiModules: updatedModules }));
                    }
                }
                nextStage = ethicsMod ? 'ETHICAL_CHECK' : 'CONTEXT'; 
                break;
            case 'ETHICAL_CHECK': 
                addLog('ETHICS', 'Running Real-Time Ethical Audit...', 'success');
                nextStage = 'CONTEXT'; 
                break;
            case 'CONTEXT': nextStage = prev.isSimulation ? 'IMAGINATION' : 'STRATEGY'; break;
            case 'IMAGINATION': nextStage = 'STRATEGY'; break;
            case 'STRATEGY': nextStage = 'ALLOCATION'; break;
            case 'ALLOCATION': 
                nextStage = 'EXECUTION'; 
                nextStatus = 'RESPONDING'; 
                if (publicMod) addLog('PUBLIC', 'Broadcasting Public Safety Alert.', 'info');
                break;
            case 'EXECUTION': 
                if(prev.isSimulation) { setActiveIncident(null); addLog('CORTEX', 'Simulation stored.', 'success'); }
                break;
        }

        return { ...prev, orchestrationStage: nextStage, status: nextStatus, orchestrationProgress: 0, overriddenByParent: isOverridden };
      });
    }, speed / 5);
    return () => clearInterval(interval);
  }, [activeIncident?.id, mode, stats.aiModules, stats.securedModules]);

  return { mode, stats, logs, activeIncident, toggleMode, toggleModule, resolveIncident };
};