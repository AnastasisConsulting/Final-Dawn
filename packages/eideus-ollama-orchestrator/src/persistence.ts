import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { SessionState } from "./session.js";
import { ToolcallEnvelope } from "./types.js";

const HOME_DIR = os.homedir();
const EIDEUS_ROOT = path.join(HOME_DIR, ".eideus", "saves");

export class PersistenceManager {
    private currentHash: string = "GENESIS_HASH";

    /**
     * Ensures the save directory exists for a given session.
     */
    async initSession(sessionId: string): Promise<string> {
        const sessionDir = path.join(EIDEUS_ROOT, sessionId);
        try {
            await fs.mkdir(sessionDir, { recursive: true });
        } catch (err) {
            // Ignore if exists
        }
        return sessionDir;
    }

    /**
     * Atomic write of the current state snapshot.
     */
    async saveState(state: SessionState) {
        const dir = await this.initSession(state.sessionId);
        const file = path.join(dir, "state.json");
        const temp = path.join(dir, "state.tmp");

        await fs.writeFile(temp, JSON.stringify(state, null, 2), "utf-8");
        await fs.rename(temp, file);
    }

    /**
     * Loads the state snapshot if it exists.
     */
    async loadState(sessionId: string): Promise<SessionState | null> {
        const file = path.join(EIDEUS_ROOT, sessionId, "state.json");
        try {
            const raw = await fs.readFile(file, "utf-8");
            return JSON.parse(raw) as SessionState;
        } catch (err) {
            return null;
        }
    }

    /**
     * Appends a log entry to memory.jsonl with a rolling hash for integrity.
     */
    async appendLog(sessionId: string, envelope: ToolcallEnvelope<any>) {
        const dir = await this.initSession(sessionId);
        const file = path.join(dir, "memory.jsonl");

        // secure rolling hash
        const payloadStr = JSON.stringify(envelope);
        const newHash = crypto
            .createHash("sha256")
            .update(this.currentHash + payloadStr)
            .digest("hex");

        this.currentHash = newHash;

        const line = JSON.stringify({ ...envelope, _hash: newHash }) + "\n";
        await fs.appendFile(file, line, "utf-8");
    }

    /**
     * Lists all available saves (directories in .eideus/saves).
     */
    async listSaves(): Promise<string[]> {
        try {
            const entries = await fs.readdir(EIDEUS_ROOT, { withFileTypes: true });
            return entries.filter((e) => e.isDirectory()).map((e) => e.name);
        } catch (err) {
            return [];
        }
    }
}

export const persistence = new PersistenceManager();
