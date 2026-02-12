
import { IncidentType, WeatherCondition, Incident } from "../types";
import { CITY_SIZE } from "../constants";

// Helper to determine severity and description based on environment
export const calculateScalarSeverity = (
  type: IncidentType, 
  weather: WeatherCondition
): { severity: number; description: string; scalarFactor?: string } => {
  
  // Default Base Severity (Random 1-3)
  let baseSeverity = Math.floor(Math.random() * 3) + 1;
  let description = "Standard anomaly detected.";
  let scalarFactor = undefined;

  if (type === IncidentType.UTILITY) {
    if (weather === 'HEATWAVE') {
      baseSeverity = 4; // Escalate to S4
      description = "CRITICAL: Grid failure during extreme heat. High casualty risk.";
      scalarFactor = "HEATWAVE_AMPLIFICATION";
    } else if (weather === 'ICESTORM') {
      baseSeverity = 4; // Escalate to S4
      description = "CRITICAL: Power loss in freezing conditions. Hypothermia risk.";
      scalarFactor = "ICESTORM_COMPOUND";
    } else if (weather === 'STORM') {
      baseSeverity = 3; // Escalate to S3
      description = "Infrastructure damage due to high winds.";
      scalarFactor = "STORM_STRESS";
    } else {
      description = "Localized utility disruption. Crew dispatched.";
    }
  } 
  else if (type === IncidentType.FLOOD && weather === 'STORM') {
    baseSeverity = 4;
    description = "Flash flood warning. Drainage systems overwhelmed.";
    scalarFactor = "PRECIPITATION_OVERLOAD";
  }
  else if (type === IncidentType.FIRE && weather === 'HEATWAVE') {
    baseSeverity = 4;
    description = "Rapid fire spread predicted due to dry heat.";
    scalarFactor = "THERMAL_AMPLIFICATION";
  }

  return { severity: baseSeverity, description, scalarFactor };
};

export const generateRandomIncident = (mode: 'NORMAL' | 'SIEGE', weather: WeatherCondition): Incident => {
  const types = mode === 'NORMAL' 
    ? [IncidentType.FIRE, IncidentType.TRAFFIC, IncidentType.FLOOD, IncidentType.MEDICAL, IncidentType.SECURITY, IncidentType.UTILITY]
    : [IncidentType.HOSTILE, IncidentType.INTEL, IncidentType.SECURITY];
  
  const randomType = types[Math.floor(Math.random() * types.length)];
  const { severity, description, scalarFactor } = calculateScalarSeverity(randomType, weather);

  // In Siege mode, severity is always high
  const finalSeverity = mode === 'SIEGE' ? Math.max(4, severity + 1) : severity;

  return {
    id: Math.random().toString(36).substr(2, 6).toUpperCase(),
    type: randomType,
    position: [(Math.random() - 0.5) * (CITY_SIZE - 4), 0, (Math.random() - 0.5) * (CITY_SIZE - 4)],
    severity: finalSeverity,
    status: mode === 'SIEGE' ? 'TRACKING' : 'DETECTED',
    orchestrationStage: 'INGESTION',
    orchestrationProgress: 0,
    timestamp: Date.now(),
    description: mode === 'SIEGE' ? "Hostile signature detected." : description,
    assignedResources: [],
    isSimulation: false,
    scalarFactor: mode === 'SIEGE' ? undefined : scalarFactor
  };
};
