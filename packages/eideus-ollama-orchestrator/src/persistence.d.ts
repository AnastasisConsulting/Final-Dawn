import { SessionState } from "./session.js";
import { ToolcallEnvelope } from "./types.js";
export declare class PersistenceManager {
    private currentHash;
    /**
     * Ensures the save directory exists for a given session.
     */
    initSession(sessionId: string): Promise<string>;
    /**
     * Atomic write of the current state snapshot.
     */
    saveState(state: SessionState): Promise<void>;
    /**
     * Loads the state snapshot if it exists.
     */
    loadState(sessionId: string): Promise<SessionState | null>;
    /**
     * Appends a log entry to memory.jsonl with a rolling hash for integrity.
     */
    appendLog(sessionId: string, envelope: ToolcallEnvelope<any>): Promise<void>;
    /**
     * Lists all available saves (directories in .eideus/saves).
     */
    listSaves(): Promise<string[]>;
}
export declare const persistence: PersistenceManager;
//# sourceMappingURL=persistence.d.ts.map