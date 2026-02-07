// packages/eideus-ollama-orchestrator/src/server.ts
import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import { OllamaClient } from "./ollama/client.js";
import { createTurnEngine } from "./turnEngine.js";
import { WorldLoader } from "./worldLoader.js";
import { sessions } from "./session.js"; // <--- IMPORT THIS
import { parseSpatialKey, parseTemporalKey } from "eideus-memory-lattice-api";
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "50mb" })); // Increased for World Files
// Initialize Services
const ollama = new OllamaClient(CONFIG.OLLAMA_HOST);
const engine = createTurnEngine({ ollama });
const memory = engine.memory;
const loader = new WorldLoader();
// --- Helpers ---
function bad(res, msg) {
    res.status(400).json({ ok: false, error: msg });
}
function normalizeRecipients(ids) {
    const list = Array.isArray(ids) ? ids : [];
    return list.map((raw) => {
        if (typeof raw === "string") {
            const id = raw.toLowerCase() === "navbot" ? "nav" : raw;
            const mode = id === "nav" ? "nav" :
                id === "vizzy" ? "vizzy" :
                    id === "lyra" ? "lyra" :
                        id === "gm" ? "gm" : "npc";
            return { id, label: id.toUpperCase(), mode };
        }
        if (raw && typeof raw === "object") {
            const rawId = typeof raw.id === "string" ? raw.id : String(raw.label ?? "npc");
            const id = rawId.toLowerCase() === "navbot" ? "nav" : rawId;
            const mode = typeof raw.mode === "string"
                ? raw.mode
                : id === "nav"
                    ? "nav"
                    : id === "vizzy"
                        ? "vizzy"
                        : id === "lyra"
                            ? "lyra"
                            : id === "gm"
                                ? "gm"
                                : "npc";
            const label = typeof raw.label === "string" ? raw.label : id.toUpperCase();
            return { id, label, mode };
        }
        return { id: "npc", label: "NPC", mode: "npc" };
    });
}
function coerceSpatial(raw) {
    if (!raw)
        throw new Error("spatial is required");
    if (typeof raw === "string")
        return parseSpatialKey(raw);
    const { g, s, o, c, ct, r } = raw;
    return {
        g: Number(g),
        s: Number(s),
        o: Number(o),
        c: Number(c),
        ct: Number(ct),
        r: Number(r),
    };
}
function coerceTemporal(raw) {
    if (!raw)
        throw new Error("temporal is required");
    if (typeof raw === "string")
        return parseTemporalKey(raw);
    const { saga, book, chapter, page } = raw;
    return {
        saga: Number(saga),
        book: Number(book),
        chapter: Number(chapter),
        page: Number(page),
    };
}
function coerceScope(raw) {
    if (!raw)
        return undefined;
    const saga = raw.saga != null ? Number(raw.saga) : undefined;
    const book = raw.book != null ? Number(raw.book) : undefined;
    if (saga == null && book == null)
        return undefined;
    return { saga, book };
}
// --- Endpoints ---
app.get("/health", async (_req, res) => {
    res.json({ status: "online", activeSessions: sessions["sessions"].size });
});
/**
 * LANDING ENDPOINT
 * Transitions from Flight-One -> Main UI.
 * Loads caches and initializes session.
 */
app.post("/land", async (req, res) => {
    try {
        const { sessionId, planetCode, playerAffinity, worldFiles } = req.body;
        if (!sessionId) {
            return bad(res, "Missing sessionId.");
        }
        // 1. Try to Load Existing Session (Persistence)
        const existing = await sessions.load(sessionId);
        if (existing) {
            console.log(`[Server] Resuming Session: ${sessionId}`);
            return res.json({
                ok: true,
                startKey: existing.location.spatial,
                startLore: "Session Resumed." // Todo: Load last lore
            });
        }
        // 2. If New, Requires World Data
        if (!planetCode || !worldFiles) {
            // fallback for dev testing if no files provided
            console.warn("[Server] No worldFiles provided, using empty default.");
        }
        console.log(`[Server] Ingesting World for New Session: ${sessionId} (${planetCode})`);
        // 3. Ingest World Data
        const result = await loader.ingestWorld({
            playerAffinity: playerAffinity || { buckets: [] },
            worldFiles: worldFiles || {}
        });
        // 4. Initialize Session State
        await sessions.create(sessionId, {
            planetCode,
            caches: result.caches,
            location: {
                spatial: result.startKey,
                temporal: { saga: 1, book: 1, chapter: 1, page: 1 }
            },
            credits: 1000,
            inventory: ["Standard Flight Suit"]
        });
        res.json({
            ok: true,
            startKey: result.startKey,
            startLore: result.startLore
        });
    }
    catch (err) {
        console.error("[Server] Landing Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
/**
 * TURN ENDPOINT
 * Executes the Gameplay Loop using Session State.
 */
app.post("/turn", async (req, res) => {
    try {
        const { sessionId, input, recipients, meta } = req.body;
        // 1. Retrieve Session
        const session = sessions.get(sessionId);
        if (!session) {
            return bad(res, "Session expired or not found. Please re-land.");
        }
        // 2. Construct Full Turn Request
        const turnReq = {
            playerText: input,
            spatial: session.location.spatial,
            temporalBase: session.location.temporal,
            page: session.location.temporal.page,
            loreKey: meta?.loreKey || "O1.intro", // UI should track current loreKey
            // Inject Caches from Session
            caches: session.caches,
            // Optional hints
            recipients: normalizeRecipients(recipients),
            tagHints: meta?.tagHints,
            entityHints: meta?.entityHints
        };
        // 3. Execute Engine
        const out = await engine.processTurn(turnReq);
        // 4. Update Session State (Time marches on)
        sessions.tick(sessionId);
        // 5. Update Spatial if output contains navigation (Future: Parse 'outputs' for moves)
        // if (out.newSpatial) session.location.spatial = out.newSpatial;
        res.json({
            ok: true,
            outputs: out.outputs,
            telemetry: {
                credits: session.credits,
                inventory: session.inventory,
                location: session.location
            }
        });
    }
    catch (err) {
        console.error("[Server] Turn Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
// --- Memory Lattice API (read-only) ---
app.post("/directVoxelRead", async (req, res) => {
    try {
        const spatial = coerceSpatial(req.body?.spatial);
        const temporal = coerceTemporal(req.body?.temporal);
        const r = await memory.lattice.directVoxelRead({ spatial, temporal });
        res.json(r);
    }
    catch (err) {
        console.error("[Server] directVoxelRead Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
app.post("/readVoxel", async (req, res) => {
    try {
        const spatial = coerceSpatial(req.body?.spatial);
        const temporal = coerceTemporal(req.body?.temporal);
        const r = await memory.lattice.readVoxel({ spatial, temporal });
        res.json(r);
    }
    catch (err) {
        console.error("[Server] readVoxel Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
app.post("/latestAtLocation", async (req, res) => {
    try {
        const spatial = coerceSpatial(req.body?.spatial);
        const scope = coerceScope(req.body?.scope ?? req.body);
        const r = await memory.lattice.latestAtLocation({ spatial, scope });
        res.json(r);
    }
    catch (err) {
        console.error("[Server] latestAtLocation Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
app.post("/directSpatialSlice", async (req, res) => {
    try {
        const spatial = coerceSpatial(req.body?.spatial);
        const filter = req.body?.filter ?? {};
        const r = await memory.lattice.directSpatialSlice({
            spatial,
            filter: {
                saga: filter.saga != null ? Number(filter.saga) : undefined,
                book: filter.book != null ? Number(filter.book) : undefined,
                chapter: filter.chapter != null ? Number(filter.chapter) : undefined,
            },
        });
        res.json(r);
    }
    catch (err) {
        console.error("[Server] directSpatialSlice Error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
// --- Startup ---
const server = app.listen(CONFIG.PORT, () => {
    console.log(`[Eideus Server] Listening on port ${CONFIG.PORT}`);
});
