import type { SpatialKey, TemporalKey } from "../../eideus-memory-lattice-api";
export type SessionState = {
    sessionId: string;
    planetCode: string;
    caches: {
        lore: Map<string, any>;
        quests: Map<string, any>;
        cast: Map<string, any>;
    };
    location: {
        spatial: SpatialKey;
        temporal: TemporalKey;
    };
    credits: number;
    inventory: string[];
};
export declare class SessionManager {
    private sessions;
    create(id: string, state: Omit<SessionState, "sessionId">): Promise<void>;
    get(id: string): SessionState | undefined;
    load(id: string): Promise<SessionState | undefined>;
    delete(id: string): void;
    tick(id: string): Promise<void>;
}
export declare const sessions: SessionManager;
//# sourceMappingURL=session.d.ts.map