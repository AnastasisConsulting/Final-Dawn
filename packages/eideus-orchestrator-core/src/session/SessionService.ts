// packages/eideus-orchestrator-core/src/session/SessionService.ts
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import type {
    VoxelCoordinate,
    TemporalKey
} from '../types.js';

export interface SessionState {
    sessionId: string;
    planetCode: string;

    playerClass?: string;
    playerAffinity?: string;

    caches: {
        lore: Map<string, any>;
        quests: Map<string, any>;
        cast: Map<string, any>;
    };

    location: {
        spatial: VoxelCoordinate;
        temporal: TemporalKey;
    };
    credits: number;
    inventory: string[];
    flags: Record<string, boolean | string | number>;
}

export class SessionService {
    private sessions = new Map<string, SessionState>();
    private saveDir: string;

    constructor(saveDir?: string) {
        this.saveDir = saveDir || path.join(os.homedir(), ".eideus", "saves");
    }

    private stringify(state: SessionState): string {
        return JSON.stringify(
            state,
            (_key, value) => {
                if (value instanceof Map) {
                    return { __type: "Map", entries: Array.from(value.entries()) };
                }
                return value;
            },
            2
        );
    }

    private parse(raw: string): SessionState {
        return JSON.parse(raw, (_key, value) => {
            if (value && typeof value === "object" && value.__type === "Map" && Array.isArray(value.entries)) {
                return new Map<string, any>(value.entries);
            }
            return value;
        }) as SessionState;
    }

    async create(id: string, state: Omit<SessionState, "sessionId">): Promise<SessionState> {
        const s = { sessionId: id, ...state };
        this.sessions.set(id, s);
        await this.save(s);
        return s;
    }

    get(id: string): SessionState | undefined {
        return this.sessions.get(id);
    }

    async load(id: string): Promise<SessionState | undefined> {
        const cached = this.sessions.get(id);
        if (cached) return cached;

        const file = path.join(this.saveDir, id, "state.json");
        try {
            const raw = await fs.readFile(file, "utf-8");
            const loaded = this.parse(raw);

            // Post-load coercion
            loaded.flags = loaded.flags || {};
            loaded.caches = loaded.caches || { lore: new Map(), quests: new Map(), cast: new Map() };

            this.sessions.set(id, loaded);
            return loaded;
        } catch (err) {
            return undefined;
        }
    }

    async save(state: SessionState) {
        const sessionDir = path.join(this.saveDir, state.sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        const file = path.join(sessionDir, "state.json");
        const temp = path.join(sessionDir, "state.tmp");

        await fs.writeFile(temp, this.stringify(state), "utf-8");
        await fs.rename(temp, file);
    }

    async tick(id: string) {
        const s = this.sessions.get(id);
        if (s) {
            s.location.temporal.page += 1;
            await this.save(s);
        }
    }
}
