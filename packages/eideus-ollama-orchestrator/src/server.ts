// packages/eideus-ollama-orchestrator/src/server.ts
import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import { OllamaClient } from "./ollama/client.js";
import { WorldLoader } from "./worldLoader.js";

import { sessions } from "./session.js";
import { persistence } from "./persistence.js";
import { parseSpatialKey, parseTemporalKey } from "eideus-memory-lattice-api";
import type { SpatialKey, TemporalKey } from "eideus-memory-lattice-api";
import * as path from "path";
import * as fs from "fs/promises";

// New Core Orchestrator
import { TurnEngine } from "@eideus/orchestrator-core";
import type { TurnContext as EngineTurnContext, TurnRecipient } from "@eideus/orchestrator-core";

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "50mb" }));

// Initialize Services
const ollama = new OllamaClient(CONFIG.OLLAMA_HOST);
const coreEngine = new TurnEngine(CONFIG.OLLAMA_HOST);

// Local Utilities (Resolution, Scaffolding, Memory)
import { createTurnEngine as createLocalPrototypes } from "./turnEngine.js";
import { resolveDeterministicContext, normalizeCaches } from "./resolver.js";
const localProto = createLocalPrototypes({ ollama });
const memory = localProto.memory;
const npcGen = localProto.npcGenerator;
const landmarkGen = localProto.landmarkGenerator;
const loader = new WorldLoader();

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
      // Rebuild caches if needed...
      return res.json({ ok: true, startKey: existing.location.spatial, startLore: "Session Resumed." });
    }

    const result = await loader.ingestWorld({
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

    // FALLBACK: If "global_void" or similar is requested, try to find ANY session that matches the meta.loreKey
    // This allows the beta-tester to function even if it loses the exact sessionId.
    if (!session && meta?.loreKey) {
      const allSessions = Array.from(sessions['sessions'].values());
      session = allSessions.find(s => s.planetCode === meta.loreKey || String(meta.loreKey).startsWith(s.planetCode));
      if (session) {
        console.log(`[Server] Fallback session found for ${meta.loreKey}: ${session.sessionId}`);
      }
    }

    if (!session) {
      console.warn(`[Server] Session NOT FOUND: ${sessionId}. Initializing transient session.`);
      // If we still have no session, we create a dummy one so the engine doesn't crash
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
        caches: { lore: {}, quests: {}, cast: {} }
      } as any;
    }

    const spatial = session!.location.spatial;
    const temporal = { ...session!.location.temporal };
    const caches = normalizeCaches(session!.caches);

    // 1. Resolve Retrieval Data
    const memories = await memory.decideAndRetrieve({
      playerText: input,
      saga: temporal.saga,
      book: temporal.book,
      spatialHint: spatial,
      llmConfig: meta?.llmConfig
    });

    const deterministic = await resolveDeterministicContext({
      spatial,
      temporal,
      loreKey: meta?.loreKey || "O1.intro",
      entitiesPresent: [], // Auto-resolve from caches
      memoryOrchestrator: memory,
      caches
    });

    // 2. Execute Core Multi-Recipient Logic (The Megablock)
    const context: EngineTurnContext = {
      playerText: input,
      spatial: spatial as any,
      temporal: temporal as any,
      loreKey: meta?.loreKey || "O1.intro",
      memories: memories.map(m => ({
        id: m.id,
        spatial: m.spatial as any,
        temporal: m.temporal as any,
        faces: {
          "x+": m.xPlus,
          "x-": m.xMinus,
          "y+": [], // optional for prompt
          "y-": m.tags,
          "z+": m.entities as any,
          "z-": m.loreKey
        }
      })),
      entitiesPresent: deterministic.entitiesResolved.map(e => ({
        id: e.id,
        name: e.name,
        class: e.class || "NPC",
        aliases: e.aliases || []
      })),
      loreEntry: deterministic.loreEntry,
      activeQuests: deterministic.activeQuests,
      flags: { ...session!.flags, ...(meta?.flags || {}) },
      recipients: normalizeRecipients(recipients || meta?.recipients),
      playerClass: session!.playerClass,
      playerAffinity: session!.playerAffinity,
      characterDirectives: meta?.characterDirectives,
      llmConfig: meta?.llmConfig
    };

    const coreOut = await coreEngine.processTurn(context);

    // 3. Post-Process Procedural Generation (NPCs/Landmarks)
    const generatedNpcs = await npcGen.processNarration(coreOut.narration, {
      objectKey: meta?.loreKey, spatial, locationName: meta?.loreKey, locationType: "QUEST_LOCALE"
    });
    const generatedLandmarks = await landmarkGen.processNarration(coreOut.narration, {
      objectKey: meta?.loreKey, spatial, locationName: meta?.loreKey, locationType: "QUEST_LOCALE"
    }, meta?.loreKey);

    // 4. Record to Lattice
    await memory.lattice.upsertVoxel({
      spatial,
      temporal,
      faces: {
        "x+": input,
        "x-": coreOut.narration,
        "y+": [], // Todo: embeddings
        "y-": [], // Todo: tags
        "z+": [...deterministic.entitiesResolved, ...generatedNpcs.map(n => n.entityRef)],
        "z-": { loreKey: meta?.loreKey, landmarks: generatedLandmarks.map(l => l.landmarkRef) } as any
      }
    });

    // 5. Update State
    if (coreOut.newFlags) {
      session!.flags = { ...session!.flags, ...coreOut.newFlags };
    }
    await sessions.tick(sessionId);

    // 6. World Sim
    await affinity.tick({ tick: 1 });
    const worldState = await affinity.getLatestSnapshot({});

    res.json({
      ok: true,
      outputs: coreOut.outputs,
      telemetry: {
        credits: session!.credits,
        inventory: session!.inventory,
        location: session!.location,
        affinity: worldState,
        flags: session!.flags
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
