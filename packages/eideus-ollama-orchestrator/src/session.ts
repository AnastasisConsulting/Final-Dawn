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
  // Persisted flags (quest progress, world toggles, etc.)
  flags: Record<string, boolean | string | number>;
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
      // JSON persistence can resurrect Maps via reviver, but older saves may still have plain objects.
      // Ensure cache surfaces are Maps so TurnEngine can use .get/.entries safely.
      const coerceMap = (v: any) => {
        if (v instanceof Map) return v as Map<string, any>;
        if (v && typeof v === "object") return new Map<string, any>(Object.entries(v));
        return new Map<string, any>();
      };

      loaded.caches = loaded.caches || ({} as any);
      (loaded.caches as any).lore = coerceMap((loaded.caches as any).lore);
      (loaded.caches as any).quests = coerceMap((loaded.caches as any).quests);
      (loaded.caches as any).cast = coerceMap((loaded.caches as any).cast);

      // Ensure flags exist
      loaded.flags = loaded.flags || {};

      this.sessions.set(id, loaded);
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
