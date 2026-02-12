export enum IncidentType {
  FIRE = 'FIRE',
  TRAFFIC = 'TRAFFIC',
  FLOOD = 'FLOOD',
  MEDICAL = 'MEDICAL',
  SECURITY = 'SECURITY',
  HOSTILE = 'HOSTILE',
  INTEL = 'INTEL',
  SIMULATION = 'SIMULATION',
  UTILITY = 'UTILITY'
}

export type SystemMode = 'NORMAL' | 'SIEGE';
export type CircadianState = 'WAKE' | 'CONSOLIDATION' | 'REM';
export type WeatherCondition = 'CLEAR' | 'STORM' | 'HEATWAVE' | 'ICESTORM' | 'WINDY';

export type AILevel = 'PARENT' | 'MODULE' | 'SUBMODEL';
export type ModuleStatus = 'ACTIVE' | 'FAILOVER' | 'OVERRIDDEN' | 'OFFLINE' | 'BOOSTED' | 'THROTTLED';

export type SeCuredModuleId = 'CORE' | 'RESPONSE' | 'RESOURCE' | 'SCORING' | 'PUBLIC' | 'ETHICS';

export interface SeCuredModule {
  id: SeCuredModuleId;
  name: string;
  description: string;
  isActive: boolean;
  isLocked: boolean; 
  features: string[];
}

export interface AIModuleState {
  id: string;
  name: string;
  level: AILevel;
  status: ModuleStatus;
  efficiency: number;
  activeTask: string;
  parentId?: string;
}

export type OrchestrationStage = 
  | 'INGESTION'       
  | 'VERIFICATION'    
  | 'ETHICAL_CHECK'
  | 'SCALAR_ANALYSIS'
  | 'HIERARCHY_REVIEW'
  | 'CONTEXT'         
  | 'IMAGINATION'
  | 'STRATEGY'        
  | 'ALLOCATION'      
  | 'EXECUTION';         

export interface Incident {
  id: string;
  type: IncidentType;
  position: [number, number, number];
  severity: number;
  status: 'DETECTED' | 'ANALYZING' | 'RESPONDING' | 'RESOLVED' | 'TRACKING' | 'NEUTRALIZED' | 'CACHED';
  orchestrationStage: OrchestrationStage;
  orchestrationProgress: number;
  timestamp: number;
  description: string;
  assignedResources: string[];
  isSimulation: boolean;
  scalarFactor?: string;
  overriddenByParent?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  // Expanded module list to include Auditing Components
  module: 'IOT' | 'CV' | 'NLP' | 'PREDICTIVE' | 'RESOURCE' | 'DEFENSE' | 'INTEL' | 'CORE' | 'CORTEX' | 'ETHICS' | 'REGISTRY' | 'ENV' | 'PARENT_AI' | 'FAILOVER' | 'PRISM' | 'PUBLIC' | 'CFC' | 'FSM' | 'OTA' | 'AUDIT';
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success' | 'tactical' | 'encrypted' | 'audit';
}

export interface AuditReport {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'EVENT';
  timestamp: number;
  summary: string;
  status: 'PASS' | 'FLAGGED';
}

export interface CityStats {
  safetyScore: number;
  activeUnits: number;
  efficiency: number;
  airQuality: number;
  intelGathered: number;
  threatLevel: number;
  cpuLoad: number;
  networkLatency: number;
  memoryUsage: { short: number; long: number; cache: number };
  ethicalAlignment: number;
  registryIntegrity: number;
  circadianPhase: CircadianState;
  temperature: number;
  weather: WeatherCondition;
  aiModules: AIModuleState[];
  securedModules: SeCuredModule[];
  recentAudits: AuditReport[]; // New: Audit History
}