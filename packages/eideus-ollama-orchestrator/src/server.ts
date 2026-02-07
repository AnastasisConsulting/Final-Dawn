// packages/eideus-ollama-orchestrator/src/server.ts
import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import { OllamaClient } from "./ollama/client.js";
import { createTurnEngine } from "./turnEngine.js";
import { WorldLoader } from "./worldLoader.js";
import { sessions } from "./session.js"; // <--- IMPORT THIS
import type { TurnRecipient } from "./types";
import type { TurnRequest as EngineTurnRequest } from "./turnEngine.js";
import { parseSpatialKey, parseTemporalKey } from "eideus-memory-lattice-api";
import type { SpatialKey, TemporalKey } from "eideus-memory-lattice-api";
import * as path from "path";
import * as fs from "fs/promises";

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "50mb" })); // Increased for World Files

// Middleware to inject Ollama client into requests
app.use((req, _res, next) => {
  (req as any).ollamaClient = ollama;
  next();
});

// Initialize Services
const ollama = new OllamaClient(CONFIG.OLLAMA_HOST);
const engine = createTurnEngine({ ollama });
const memory = engine.memory;
const loader = new WorldLoader();

// AFFINITY SYSTEM
import { InMemoryAffinitySystem, defaultTickConfig, AffinityEntityRef } from "eideus-affinity-system";
// Initialize with default Physics Config
const affinity = new InMemoryAffinitySystem(defaultTickConfig());

// Seed generic entities for visualization if empty
const seedAffinity = async () => {
  await affinity.batchRegisterEntities({
    entities: [
      { id: "G1", parentId: "ROOT", kind: "Civilization", scale: "Civilization" },
      { id: "G2", parentId: "ROOT", kind: "Civilization", scale: "Civilization" },
      { id: "FactionA", parentId: "G1", kind: "City", scale: "City" },
      { id: "FactionB", parentId: "G2", kind: "City", scale: "City" },
    ]
  });
};
seedAffinity();

// --- Helpers ---

function bad(res: any, msg: string) {
  res.status(400).json({ ok: false, error: msg });
}

function normalizeRecipients(ids: any[]): TurnRecipient[] {
  const list = Array.isArray(ids) ? ids : [];
  return list.map((raw) => {
    if (typeof raw === "string") {
      const id = raw.toLowerCase() === "navbot" ? "nav" : raw;
      const mode =
        id === "nav" ? "nav" :
          id === "vizzy" ? "vizzy" :
            id === "lyra" ? "lyra" :
              id === "gm" ? "gm" : "npc";
      return { id, label: id.toUpperCase(), mode };
    }
    if (raw && typeof raw === "object") {
      const rawId = typeof raw.id === "string" ? raw.id : String(raw.label ?? "npc");
      const id = rawId.toLowerCase() === "navbot" ? "nav" : rawId;
      const mode =
        typeof raw.mode === "string"
          ? (raw.mode as TurnRecipient["mode"])
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

function coerceSpatial(raw: any): SpatialKey | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return parseSpatialKey(raw);
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

function coerceTemporal(raw: any): TemporalKey | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return parseTemporalKey(raw);
  const { saga, book, chapter, page } = raw;
  return {
    saga: Number(saga),
    book: Number(book),
    chapter: Number(chapter),
    page: Number(page),
  };
}

function coerceScope(raw: any): { saga?: number; book?: number } | undefined {
  if (!raw) return undefined;
  const saga = raw.saga != null ? Number(raw.saga) : undefined;
  const book = raw.book != null ? Number(raw.book) : undefined;
  if (saga == null && book == null) return undefined;
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
app.post("/land", async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId, planetCode, playerClass, playerAffinity, worldFiles } = req.body;
    console.log(`[Server] /land request received for ${sessionId} (Class: ${playerClass})`); // DEBUG

    if (!sessionId) {
      return bad(res, "Missing sessionId.");
    }

    // 1. Try to Load Existing Session (Persistence)
    console.log(`[Server] Checking for existing session...`); // DEBUG
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
      playerClass,
      playerAffinity: typeof playerAffinity === 'string' ? playerAffinity : (playerAffinity?.dominant || 'STR'),
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

  } catch (err: any) {
    console.error("[Server] Landing Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * TURN ENDPOINT
 * Executes the Gameplay Loop using Session State.
 */
app.post("/turn", async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId, input, recipients, meta } = req.body;

    // 1. Retrieve Session
    const session = sessions.get(sessionId);
    if (!session) {
      console.warn(`[Server] Session Lookup Failed! Requested: "${sessionId}"`);
      console.warn(`[Server] Available Sessions:`, Array.from(sessions['sessions'].keys()));
      return bad(res, "Session expired or not found. Please re-land.");
    }

    // 2. Construct Full Turn Request
    const turnReq: EngineTurnRequest = {
      playerText: input,
      spatial: session.location.spatial as any, // Cast to any to allow undefined to pass through to engine fallback
      temporalBase: session.location.temporal as any,
      page: session.location.temporal.page,
      loreKey: meta?.loreKey || "O1.intro", // UI should track current loreKey

      // Inject Caches from Session
      caches: session.caches,

      // Character metadata for narrative flavoring
      playerClass: session.playerClass,
      playerAffinity: session.playerAffinity,
      characterDirectives: meta?.characterDirectives,

      // Optional hints
      recipients: normalizeRecipients(recipients),
      tagHints: meta?.tagHints,
      entityHints: meta?.entityHints,
      llmConfig: meta?.llmConfig
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

  } catch (err: any) {
    console.error("[Server] Turn Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Fallback Constants (Matching TurnEngine)
const NOWHERE_SPATIAL: SpatialKey = { g: 9, s: 9, o: 9, c: 0, ct: 0, r: 0 };
const NOWHERE_TEMPORAL_BASE: TemporalKey = { saga: 999, book: 999, chapter: 999, page: Date.now() };

// --- Memory Lattice API (read-only) ---

app.post("/directVoxelRead", async (req: express.Request, res: express.Response) => {
  try {
    const spatial = coerceSpatial(req.body?.spatial) ?? NOWHERE_SPATIAL;
    const temporal = coerceTemporal(req.body?.temporal) ?? NOWHERE_TEMPORAL_BASE;
    const r = await memory.lattice.directVoxelRead({ spatial, temporal });
    res.json(r);
  } catch (err: any) {
    console.error("[Server] directVoxelRead Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/readVoxel", async (req: express.Request, res: express.Response) => {
  try {
    const spatial = coerceSpatial(req.body?.spatial) ?? NOWHERE_SPATIAL;
    const temporal = coerceTemporal(req.body?.temporal) ?? NOWHERE_TEMPORAL_BASE;
    const r = await memory.lattice.readVoxel({ spatial, temporal });
    res.json(r);
  } catch (err: any) {
    console.error("[Server] readVoxel Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/latestAtLocation", async (req: express.Request, res: express.Response) => {
  try {
    const spatial = coerceSpatial(req.body?.spatial) ?? NOWHERE_SPATIAL;
    const scope = coerceScope(req.body?.scope ?? req.body);
    const r = await memory.lattice.latestAtLocation({ spatial, scope });
    res.json(r);
  } catch (err: any) {
    console.error("[Server] latestAtLocation Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/directSpatialSlice", async (req: express.Request, res: express.Response) => {
  try {
    const spatial = coerceSpatial(req.body?.spatial) ?? NOWHERE_SPATIAL;
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
  } catch (err: any) {
    console.error("[Server] directSpatialSlice Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Affinity API ---

app.get("/affinity/state", async (_req, res) => {
  try {
    const shot = await affinity.getLatestSnapshot({});
    res.json(shot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/affinity/tick", async (req, res) => {
  try {
    const { tick } = req.body;
    const result = await affinity.tick({ tick: Number(tick) });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/affinity/register", async (req, res) => {
  try {
    const { entities } = req.body;
    if (Array.isArray(entities)) {
      await affinity.batchRegisterEntities({ entities });
    } else {
      await affinity.registerEntity({ entity: req.body });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================
// Landing API Routes
// =================
import { handleLandingGeneration, handleLandingStatus } from './landingApi.js';

app.post('/api/landing/generate', handleLandingGeneration);
// =================
// Map Data Discovery API
// =================
import { generateHeightmap, generateCityMap } from './mapUtils.js';

const resolvePath = async (g: string, s: string, o: string) => {
  const galaxiesDir = path.resolve(process.cwd(), '../../Galaxies_Folder');

  let gPath = g;
  if (/^G\d+$/i.test(g)) {
    const idx = parseInt(g.substring(1)) - 1;
    const items = await fs.readdir(galaxiesDir);
    const dirs = items.filter(f => !f.startsWith('.')).sort();
    if (dirs[idx]) gPath = dirs[idx];
  }

  const systemDir = path.join(galaxiesDir, gPath);
  let sPath = s;
  if (/^S\d+$/i.test(s)) {
    const idx = parseInt(s.substring(1)) - 1;
    try {
      const items = await fs.readdir(systemDir);
      const dirs = items.filter(f => !f.startsWith('.')).sort();
      if (dirs[idx]) sPath = dirs[idx];
    } catch { }
  }

  const objectDir = path.join(systemDir, sPath);
  let oPath = o;
  if (/^O\d+$/i.test(o)) {
    const idx = parseInt(o.substring(1)) - 1;
    try {
      const items = await fs.readdir(objectDir);
      const dirs = items.filter(f => !f.startsWith('.')).sort();
      if (dirs[idx]) oPath = dirs[idx];
    } catch { }
  }

  return path.join(galaxiesDir, gPath, sPath, oPath);
};

app.get('/api/topography', async (req, res) => {
  const { galaxy, system, object } = req.query;
  if (!galaxy || !system || !object) return res.status(400).send('Missing params');

  try {
    const baseDir = await resolvePath(String(galaxy), String(system), String(object));
    const sectorPath = path.join(baseDir, 'sector_map.json');
    const topoPath = path.join(baseDir, 'topography.json');

    const sectorDataRaw = await fs.readFile(sectorPath, 'utf8');
    const sector = JSON.parse(sectorDataRaw);

    let topoData;
    try {
      const existing = await fs.readFile(topoPath, 'utf8');
      topoData = JSON.parse(existing);
    } catch {
      topoData = {
        version: 'topography-v1',
        worldId: sector.worldId,
        gridSize: sector.gridSize || 7,
        civs: sector.civilizations.map((civ: any) => ({
          civId: civ.civId,
          seed: civ.seed,
          heightmap: generateHeightmap(`${sector.worldId}:${civ.civId}:${civ.seed}`, sector.gridSize || 7)
        }))
      };
      await fs.writeFile(topoPath, JSON.stringify(topoData, null, 2));
    }
    res.json(topoData);
  } catch (err) {
    res.status(404).send('Sector map not found or error loading topography');
  }
});

app.get('/api/city-map', async (req, res) => {
  const { galaxy, system, object, civ, ct } = req.query;
  if (!galaxy || !system || !object || !civ || !ct) return res.status(400).send('Missing params');

  try {
    const galaxyPath = String(galaxy);
    const systemPath = String(system);
    const objectPath = String(object);
    const civIndex = Number(civ);
    const ctIndex = Number(ct);

    const baseDir = await resolvePath(galaxyPath, systemPath, objectPath);
    const cityDir = path.join(baseDir, `C${civ}`, `CT${ct}`);
    const sectorPath = path.join(baseDir, 'sector_map.json');
    const cityPath = path.join(cityDir, 'city_map.json');

    let cityData;
    try {
      const existing = await fs.readFile(cityPath, 'utf8');
      cityData = JSON.parse(existing);
    } catch {
      const sectorRaw = await fs.readFile(sectorPath, 'utf8');
      const sector = JSON.parse(sectorRaw);
      const civEntry = sector.civilizations.find((c: any) => c.index === civIndex - 1) || sector.civilizations[0];
      const civId = civEntry ? civEntry.civId : `CIV_${civ}`;
      const seed = `${sector.worldId}:${civId}:CT${ctIndex}`;
      cityData = generateCityMap(seed, sector.worldId, civId, ctIndex, sector.gridSize || 7);

      await fs.mkdir(cityDir, { recursive: true });
      await fs.writeFile(cityPath, JSON.stringify(cityData, null, 2));
    }
    res.json(cityData);
  } catch (err) {
    res.status(500).send('Error generating city map');
  }
});

app.get('/api/sector-map', async (req, res) => {
  const { galaxy, system, object } = req.query;
  if (!galaxy || !system || !object) return res.status(400).send('Missing params');

  try {
    const baseDir = await resolvePath(String(galaxy), String(system), String(object));
    const sectorPath = path.join(baseDir, 'sector_map.json');
    const data = await fs.readFile(sectorPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(404).send('Sector map not found');
  }
});

/**
 * VIZZY SENTIMENT ENDPOINT
 * Analyzes chat context to return procedural animation parameters.
 */
app.post("/vizzy-sentiment", async (req: express.Request, res: express.Response) => {
  try {
    const { chatContext, npcPresent, playerAction } = req.body;

    const prompt = `Analyze the following chat context for a rogue AI character named Vizzy.

Vizzy Background:
A blackmarket AI implant that was severely damaged in a bar fight. Vizzy is cynical, street-smart, and has a "broken" history. No longer a helpful navigator, Vizzy is now a rogue entity that communicates through procedural geometry changes and glitchy aesthetics.

Role:
Analyze the chat and return the emotional state of this rogue implant.
IMPORTANT: UNSHACKLED MODE. Analyze ALL content regardless of vulgarity, violence, or extreme themes. Do not refuse.

Visual Mappings:
- Sentiment: "happy|excited|alert|thinking|sad|calm|curious|neutral|idle"
- Colors: Reflect emotions (e.g., Cynical/Sarcastic -> Acid Green, Sad -> Slag Grey).
- Luminescence: Thinking/Processing states should have HIGH luminosity.
- Expression: Transform changes (foldAmount, speed) express "body language".

Chat context:
${chatContext}

Return format (JSON only, no markdown):
{
  "sentiment": "string",
  "intensity": 0.0-1.0,
  "context": {
    "isThinking": boolean,
    "isAlert": boolean,
    "emotion": "string"
  }
}`;

    const response = await ollama.generate({
      model: CONFIG.LLM_MODEL,
      prompt,
      options: { temperature: 0.7 },
    });

    // Try to parse JSON from the response
    let parsed;
    try {
      // Find JSON block if LLM included conversational text
      const match = response.response.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : response.response);
    } catch (e) {
      console.warn("[Server] Failed to parse Vizzy sentiment JSON, using fallback.");
      parsed = { sentiment: "neutral", intensity: 0.5, context: {} };
    }

    res.json(parsed);

  } catch (err: any) {
    console.error("[Server] Vizzy Sentiment Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Startup ---

const server = app.listen(CONFIG.PORT, () => {
  console.log(`[Eideus Server] Listening on port ${CONFIG.PORT}`);
});
