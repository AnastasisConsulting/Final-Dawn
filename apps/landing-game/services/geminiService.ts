import { GamePhase } from "../types";

const DEFAULT_BASE = 'http://localhost:4000';

type LlmConfig = {
  baseUrl?: string;
  apiKey?: string;
  models?: { navbot?: string };
};

const loadConfig = (): LlmConfig => {
  try {
    const raw = localStorage.getItem('eideus.llmconfig');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const callOllama = async (prompt: string, system?: string) => {
  const cfg = loadConfig();
  const baseUrl = cfg.baseUrl || DEFAULT_BASE;
  const model = cfg.models?.navbot || 'llama3';

  // Hit the Orchestrator Proxy
  const res = await fetch(`${baseUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      prompt,
      system
    }),
  });

  if (!res.ok) throw new Error(`Orchestrator error: ${res.status}`);
  const data = await res.json();
  return data.response || '';
};

export const getMissionUpdate = async (
  phase: GamePhase,
  altitude: number,
  hull: number,
  speed: number
): Promise<string> => {
  // 1. Check for Critical Priority Warnings first
  if (hull < 30 && phase !== GamePhase.CRASHED && phase !== GamePhase.LANDED) {
    const criticalMsgs = [
      `MAYDAY: Hull integrity critical at ${Math.round(hull)}%!`,
      "WARNING: Structural collapse imminent! Eject if possible!",
      "Damage report: Multiple breaches detected."
    ];
    return criticalMsgs[Math.floor(Math.random() * criticalMsgs.length)];
  }

  if (speed > 1.2 && phase === GamePhase.FLIGHT) {
    return `OVERSPEED WARNING: Current velocity ${Math.round(speed * 1000)} km/h is unsafe for landing!`;
  }

  if (altitude < 400 && phase === GamePhase.FLIGHT && speed > 0.5) {
    return `TERRAIN ALERT: Pull up! You are too fast for this altitude!`;
  }

  try {
    const prompt = `You are Mission Control. Provide one concise landing guidance line (1 sentence).
Phase: ${GamePhase[phase]}.
Altitude: ${Math.round(altitude)}.
Hull: ${Math.round(hull)}%.
Speed: ${speed.toFixed(2)}.`;
    const response = await callOllama(prompt, 'Keep it terse, tactical, and flight-control focused.');
    return response.trim() || 'Maintain approach vector.';
  } catch (err) {
    return 'Comms unstable. Maintain approach vector.';
  }
};
