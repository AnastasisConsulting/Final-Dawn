import { IncidentType, OrchestrationStage, SeCuredModule } from "./types";

export const CITY_SIZE = 20;
export const BUILDING_COUNT = 150;

export const INCIDENT_COLORS = {
  [IncidentType.FIRE]: '#ef4444', 
  [IncidentType.TRAFFIC]: '#f59e0b', 
  [IncidentType.FLOOD]: '#3b82f6', 
  [IncidentType.MEDICAL]: '#ec4899', 
  [IncidentType.SECURITY]: '#a855f7', 
  [IncidentType.HOSTILE]: '#dc2626', 
  [IncidentType.INTEL]: '#10b981', 
  [IncidentType.SIMULATION]: '#6366f1',
  [IncidentType.UTILITY]: '#eab308'
};

export const ORCHESTRATION_STEPS: {id: OrchestrationStage, label: string}[] = [
  { id: 'INGESTION', label: 'DATA INTAKE' },
  { id: 'VERIFICATION', label: 'VERIFICATION' },
  { id: 'SCALAR_ANALYSIS', label: 'SCALAR CHECK' },
  { id: 'HIERARCHY_REVIEW', label: 'PARENT AI' },
  { id: 'ETHICAL_CHECK', label: 'ETHICAL EVAL' },
  { id: 'CONTEXT', label: 'MEMORY RECALL' },
  { id: 'STRATEGY', label: 'STRATEGY GEN' },
  { id: 'ALLOCATION', label: 'RES. ALLOC' },
  { id: 'EXECUTION', label: 'DEPLOYMENT' }
];

export const COGNITIVE_LOG_MESSAGES = {
  WAKE: [
    "Sensory streams: ACTIVE.",
    "Registry lock: ENGAGED.",
    "Real-time optimization engaged."
  ],
  CONSOLIDATION: [
    "Pruning short-term cache...",
    "Archiving patterns to LTM.",
    "Registry update: Appending logs."
  ],
  REM: [
    "Running threat scenarios...",
    "Imagination Engine: 'What-If' clusters.",
    "Optimizing neural pathways."
  ]
};

export const INITIAL_SECURED_MODULES: SeCuredModule[] = [
  {
    id: 'CORE',
    name: 'Core Module',
    description: 'Basic Monitoring & Status Reporting',
    isActive: true,
    isLocked: true,
    features: ['Crisis Monitoring', 'Resource Status', 'Safety Alerts']
  },
  {
    id: 'RESPONSE',
    name: 'Response Coord.',
    description: 'Inter-agency Routing & Comms',
    isActive: false,
    isLocked: false,
    features: ['Emergency Routing', 'Agency Hub']
  },
  {
    id: 'RESOURCE',
    name: 'Supply & Alloc.',
    description: 'Supply Chain & Dynamic Allocation',
    isActive: false,
    isLocked: false,
    features: ['Supply Monitor', 'Predictive Needs']
  },
  {
    id: 'SCORING',
    name: 'Crisis Scoring',
    description: 'PRISM Prioritization Formula',
    isActive: false,
    isLocked: false,
    features: ['PRISM Scoring', 'Risk Assess']
  },
  {
    id: 'PUBLIC',
    name: 'Public Comms',
    description: 'Transparency & Alerts',
    isActive: false,
    isLocked: false,
    features: ['Public Dash', 'Auto-Alerts']
  },
  {
    id: 'ETHICS',
    name: 'Ethical Oversight',
    description: 'Audits & Fail-Safes',
    isActive: false,
    isLocked: false,
    features: ['Access Control', 'Real-Time Audit']
  }
];