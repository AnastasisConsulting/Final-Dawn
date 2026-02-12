import { AIModuleState, Incident, LogEntry, IncidentType } from "../types";

export const INITIAL_MODULES: AIModuleState[] = [
  // Parent AI
  { id: 'CORE', name: 'PARENT AI CORE', level: 'PARENT', status: 'ACTIVE', efficiency: 100, activeTask: 'Orchestrating' },
  
  // Multi-Modal Module: Emergency Response Complex
  { id: 'EMERGENCY', name: 'Emergency Complex', level: 'MODULE', status: 'ACTIVE', efficiency: 100, activeTask: 'Coordination' },
  { id: 'ROUTING', name: 'Routing Sub-AI', level: 'SUBMODEL', status: 'ACTIVE', efficiency: 99, activeTask: 'Pathfinding', parentId: 'EMERGENCY' },
  { id: 'RESOURCE', name: 'Resource Sub-AI', level: 'SUBMODEL', status: 'ACTIVE', efficiency: 95, activeTask: 'Inventory', parentId: 'EMERGENCY' },
  { id: 'PREDICT', name: 'Predictive Sub-AI', level: 'SUBMODEL', status: 'ACTIVE', efficiency: 92, activeTask: 'Modeling', parentId: 'EMERGENCY' },

  // Single-Model Module: Traffic
  { id: 'TRAFFIC', name: 'Traffic Control AI', level: 'MODULE', status: 'ACTIVE', efficiency: 98, activeTask: 'Flow Opt' },
  
  // Independent Module
  { id: 'FAILOVER', name: 'Failover Watchdog', level: 'MODULE', status: 'ACTIVE', efficiency: 100, activeTask: 'Monitoring' }
];

export const checkConflicts = (incident: Incident, modules: AIModuleState[]): { conflict: boolean; resolutionLog?: LogEntry; updatedModules?: AIModuleState[] } => {
  
  if ((incident.type === IncidentType.FIRE || incident.type === IncidentType.MEDICAL) && incident.severity >= 3) {
    const trafficAI = modules.find(m => m.id === 'TRAFFIC');
    
    if (trafficAI && trafficAI.status === 'ACTIVE' && Math.random() > 0.7) {
      const updatedModules = modules.map(m => 
        m.id === 'TRAFFIC' ? { ...m, status: 'OVERRIDDEN' as const, activeTask: 'Yielding to EMS' } : m
      );
      
      return {
        conflict: true,
        updatedModules,
        resolutionLog: {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          module: 'PARENT_AI',
          message: `CONFLICT: Traffic AI route optimization conflicts with Emergency Routing. OVERRIDE: Priority EMS.`,
          type: 'critical'
        }
      };
    }
  }

  // Parent AI Resource Reallocation (S4+)
  if (incident.severity >= 4) {
     const emergencyModule = modules.find(m => m.id === 'EMERGENCY');
     
     if (emergencyModule && emergencyModule.status !== 'BOOSTED' && Math.random() > 0.5) {
        const updatedModules = modules.map(m => {
            if (m.id === 'EMERGENCY' || m.parentId === 'EMERGENCY') 
                return { ...m, status: 'BOOSTED' as const, efficiency: 120, activeTask: 'High Priority' };
            if (m.id === 'TRAFFIC') 
                return { ...m, status: 'THROTTLED' as const, efficiency: 40, activeTask: 'Low Priority' };
            return m;
        });

        return {
            conflict: true, 
            updatedModules,
            resolutionLog: {
              id: Math.random().toString(),
              timestamp: new Date().toLocaleTimeString(),
              module: 'PARENT_AI',
              message: `REALLOCATION: Boosting Emergency Multi-Modal Complex. Throttling Traffic AI.`,
              type: 'warning'
            }
        };
     }
  }

  return { conflict: false };
};

export const checkFailover = (modules: AIModuleState[]): { updatedModules: AIModuleState[]; log?: LogEntry } | null => {
  // Simulate Sub-Model Failure
  if (Math.random() > 0.98) { 
    const submodels = modules.filter(m => m.level === 'SUBMODEL' && m.status === 'ACTIVE');
    
    if (submodels.length > 0) {
      const target = submodels[Math.floor(Math.random() * submodels.length)];
      
      const updated = modules.map(m => {
          if (m.id === target.id) return { ...m, status: 'FAILOVER' as const, efficiency: 45, activeTask: 'Rerouting...' };
          if (m.id === target.parentId) {
              return { ...m, efficiency: Math.max(50, m.efficiency - 20) };
          }
          return m;
      });
      
      return {
        updatedModules: updated,
        log: {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          module: 'FAILOVER',
          message: `ANOMALY: ${target.name} malfunction. Parent Module degraded but operational.`,
          type: 'warning'
        }
      };
    }
  }
  
  const failedIndex = modules.findIndex(m => m.status === 'FAILOVER');
  if (failedIndex !== -1 && Math.random() > 0.9) {
     const failedModule = modules[failedIndex];
     const updated = modules.map(m => {
         if (m.id === failedModule.id) return { ...m, status: 'ACTIVE' as const, efficiency: 95, activeTask: 'Recovered' };
         if (m.id === failedModule.parentId) return { ...m, efficiency: 100 };
         return m;
     });

     return {
        updatedModules: updated,
        log: {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          module: 'PARENT_AI',
          message: `RECOVERY: ${failedModule.name} online. Multi-modal redundancy restored.`,
          type: 'success'
        }
     }
  }

  return null;
};