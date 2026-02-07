import { persistence } from "./persistence.js";
export class SessionManager {
    sessions = new Map();
    async create(id, state) {
        const s = { sessionId: id, ...state };
        this.sessions.set(id, s);
        await persistence.saveState(s);
    }
    get(id) {
        return this.sessions.get(id);
    }
    async load(id) {
        const cached = this.sessions.get(id);
        if (cached)
            return cached;
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
    delete(id) {
        this.sessions.delete(id);
    }
    // Advance time page
    async tick(id) {
        const s = this.sessions.get(id);
        if (s) {
            s.location.temporal.page += 1;
            await persistence.saveState(s);
        }
    }
}
export const sessions = new SessionManager();
