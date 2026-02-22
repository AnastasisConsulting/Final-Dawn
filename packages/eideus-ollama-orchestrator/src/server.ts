import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import { Ollama } from "ollama";

// New Core Orchestrator
import {
  TurnEngine,
  MemoryService,
  SessionService,
  WorldService,
  TurnContext as EngineTurnContext,
  TurnRecipient
} from "@eideus/orchestrator-core";
import { InMemoryLattice, parseSpatialKey, parseTemporalKey } from "eideus-memory-lattice-api";
import type { SpatialKey, TemporalKey } from "eideus-memory-lattice-api";

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "50mb" }));

// Initialize Services (New Core Engine)
const ollama = new Ollama({ host: CONFIG.OLLAMA_HOST });
const lattice = new InMemoryLattice();

const memory = new MemoryService({ ollama, lattice, embedModel: CONFIG.EMBED_MODEL });
const sessions = new SessionService();
const world = new WorldService();
const coreEngine = new TurnEngine({
  ollama,
  lattice,
  embedModel: CONFIG.EMBED_MODEL || "mxbai-embed-large",
  llmModel: "llama3:latest"
});

// AFFINITY SYSTEM
import { InMemoryAffinitySystem, defaultTickConfig } from "eideus-affinity-system";
const affinity = new InMemoryAffinitySystem(defaultTickConfig());

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
      return { id, label: id.toUpperCase(), mode: mode as any };
    }
    if (raw && typeof raw === "object") {
      const rawId = typeof raw.id === "string" ? raw.id : String(raw.label ?? "npc");
      const id = rawId.toLowerCase() === "navbot" ? "nav" : rawId;
      const mode =
        typeof raw.mode === "string"
          ? (raw.mode as any)
          : id === "nav" ? "nav" : id === "vizzy" ? "vizzy" : id === "lyra" ? "lyra" : id === "gm" ? "gm" : "npc";
      const label = typeof raw.label === "string" ? raw.label : id.toUpperCase();
      return { id, label, mode };
    }
    return { id: "npc", label: "NPC", mode: "npc" };
  });
}

function coerceSpatial(raw: any): SpatialKey | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return parseSpatialKey(raw);
  return {
    g: Number(raw.g), s: Number(raw.s), o: Number(raw.o),
    c: Number(raw.c), ct: Number(raw.ct), r: Number(raw.r),
  };
}

function coerceTemporal(raw: any): TemporalKey | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return parseTemporalKey(raw);
  return {
    saga: Number(raw.saga), book: Number(raw.book),
    chapter: Number(raw.chapter), page: Number(raw.page),
  };
}

// --- Endpoints ---

app.post("/land", async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId, planetCode, playerClass, playerAffinity, worldFiles } = req.body;
    let existing = await sessions.load(sessionId);

    if (existing) {
      return res.json({ ok: true, startKey: existing.location.spatial, startLore: "Session Resumed." });
    }

    const result = await world.ingestWorld({
      playerAffinity: playerAffinity || { buckets: [] },
      worldFiles: worldFiles || {}
    });

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
      inventory: ["Standard Flight Suit"],
      flags: {}
    });

    res.json({ ok: true, startKey: result.startKey, startLore: result.startLore });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/turn", async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId, input, recipients, meta } = req.body;
    console.log(`[Server] POST /turn | session: ${sessionId} | input: "${input?.slice(0, 30)}..."`);

    let session = sessions.get(sessionId) || await sessions.load(sessionId);

    if (!session && meta?.loreKey) {
      // Fallback logic could go here if needed
    }

    if (!session) {
      console.warn(`[Server] Session NOT FOUND: ${sessionId}. Initializing transient session.`);
      session = {
        sessionId: sessionId || "transient",
        planetCode: meta?.loreKey || "O1",
        playerClass: "Scrubber",
        playerAffinity: "STR",
        location: {
          spatial: meta?.spatial || { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
          temporal: { saga: 1, book: 1, chapter: 1, page: 1 }
        },
        credits: 0,
        inventory: [],
        flags: {},
        caches: { lore: new Map(), quests: new Map(), cast: new Map() }
      };
    }

    const spatial = session.location.spatial;
    const temporal = { ...session.location.temporal };

    // 1. Memory Retrieval via new MemoryService
    const memories = await memory.decideAndRetrieve({
      playerText: input,
      saga: temporal.saga,
      book: temporal.book,
      spatialHint: spatial,
      llmConfig: meta?.llmConfig
    });

    // 2. Prepare Core Context
    const context: EngineTurnContext = {
      playerText: input,
      spatial: spatial as any,
      temporal: temporal as any,
      loreKey: meta?.loreKey || "O1.intro",
      memories: memories,
      entitiesPresent: [],
      flags: { ...session.flags, ...(meta?.flags || {}) },
      recipients: normalizeRecipients(recipients || meta?.recipients),
      playerClass: session.playerClass,
      playerAffinity: session.playerAffinity,
      characterDirectives: meta?.characterDirectives,
      llmConfig: meta?.llmConfig
    };

    // 3. Process Turn via Core Engine
    const coreOut = await coreEngine.processTurn(context, session.caches);

    // 4. Update Session State
    if (coreOut.newFlags) {
      session.flags = { ...session.flags, ...coreOut.newFlags };
    }

    session.location.temporal.page += 1;
    // BETA: Skip disk persistence — lattice memory is the source of truth during testing.
    // await sessions.save(session);

    // 5. World Sim
    await affinity.tick({ tick: 1 });
    const worldState = await affinity.getLatestSnapshot({});

    res.json({
      ok: true,
      outputs: coreOut.outputs,
      thought: coreOut.thought,
      telemetry: {
        credits: session.credits,
        inventory: session.inventory,
        location: session.location,
        affinity: worldState,
        flags: session.flags
      },
      questUpdates: coreOut.questUpdates
    });

  } catch (err: any) {
    console.error("[Server] Turn Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(CONFIG.PORT, () => {
  console.log(`[Eideus Server] Listening on port ${CONFIG.PORT} (USING CORE ENGINE)`);
});
