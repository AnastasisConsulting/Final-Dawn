import type { SpatialKey, TemporalKey } from "../../eideus-memory-lattice-api";
import { persistence } from "./persistence.js";

export type SessionState = {
  sessionId: string;
  planetCode: string; // "O1" - "O7"

  // Character Data
  playerClass?: string;    // "Rebel", "Acolyte", "Hacker"
  playerAffinity?: string; // "STR", "INT", "DEX"

  // State from WorldLoader
  caches: {
    lore: Map<string, any>;
    quests: Map<string, any>;
    cast: Map<string, any>;
  };

  // Telemetry (Mutable)
  location: {
    spatial: SpatialKey;
    temporal: TemporalKey;
  };
  credits: number;
  inventory: string[];
};

export class SessionManager {
  private sessions = new Map<string, SessionState>();

  async create(id: string, state: Omit<SessionState, "sessionId">) {
    const s = { sessionId: id, ...state };
    this.sessions.set(id, s);
    await persistence.saveState(s);
  }

  get(id: string): SessionState | undefined {
    return this.sessions.get(id);
  }

  async load(id: string): Promise<SessionState | undefined> {
    const cached = this.sessions.get(id);
    if (cached) return cached;

    const loaded = await persistence.loadState(id);
    if (loaded) {
      this.sessions.set(id, loaded);
      // Rehydrate Maps (JSON logic usually kills Maps, we might need a reviver, 
      // but for now we assume caches are transient or re-fetched. 
      // Actually, WorldLoader caches need to be rebuilt. 
      // For MVP, we'll let them re-init empty or rely on the Orchestrator to refill.)
      return loaded;
    }
    return undefined;
  }

  delete(id: string) {
    this.sessions.delete(id);
  }

  // Advance time page
  async tick(id: string) {
    const s = this.sessions.get(id);
    if (s) {
      s.location.temporal.page += 1;
      await persistence.saveState(s);
    }
  }
}

export const sessions = new SessionManager();