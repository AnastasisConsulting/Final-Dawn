// Final_Dawn_of_Eideus/packages/eideus-ollama-orchestrator/src/turnEngine.ts
import { OllamaClient } from "./ollama/client";
import { CONFIG } from "./config.js";
import { createMemoryOrchestrator } from "./memoryOrchestrator.js";
import { createNpcGenerator, type GeneratedNpc, type EntityRef } from "./npc/index.js";
import { createLandmarkGenerator, type GeneratedLandmark, type LandmarkRef } from "./landmark/index.js";
import type { SpatialKey, TemporalKey, EntityCard, LoreContext, LandmarkCard } from "eideus-memory-lattice-api";
import { buildMultiRecipientPrompt, parseLabeledSections, TurnRecipient } from "./prompts.js";
import type { RecipientMode } from "./prompts";

function coerceMapLike(v: any): Map<string, any> {
  if (v instanceof Map) return v;
  if (v && typeof v === "object") return new Map<string, any>(Object.entries(v));
  return new Map<string, any>();
}

function normalizeCaches(raw: any): { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> } {
  return {
    lore: coerceMapLike(raw?.lore),
    quests: coerceMapLike(raw?.quests),
    cast: coerceMapLike(raw?.cast),
  };
}


/**
 * Auto-resolve entities (NPCs) that should be at a given spatial location.
 * Scans the cast cache for entity IDs matching the spatial key pattern.
 */
function resolveEntitiesFromLocation(
  spatial: SpatialKey,
  caches: { cast: Map<string, any>; quests: Map<string, any> }
): EntityCard[] {
  const entities: EntityCard[] = [];

  // Build spatial pattern to match: G{g}-S{s}-O{o}-C{c}-CT{ct}-R{r}
  const spatialPattern = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c}-CT${spatial.ct}-R${spatial.r}`;

  // Scan cast cache for entities at this location
  for (const [entityId, entityData] of caches.cast.entries()) {
    if (entityId.startsWith(spatialPattern)) {
      entities.push({
        id: entityId,
        name: entityData?.name ?? entityId,
        class: entityData?.role ?? "NPC",
        aliases: [],
      });
    }
  }

  // Also check quests cache for quest-giver NPCs at this location
  for (const [npcId, _questList] of caches.quests.entries()) {
    if (npcId.startsWith(spatialPattern) && !entities.some(e => e.id === npcId)) {
      const entityData = caches.cast.get(npcId);
      entities.push({
        id: npcId,
        name: entityData?.name ?? npcId,
        class: entityData?.role ?? "Quest Giver",
        aliases: [],
      });
    }
  }

  return entities;
}

/**
 * Deterministic Context Resolver
 * Injects only the specific data requested by the coordinate keys.
 */
async function resolveDeterministicContext(args: {
  spatial: SpatialKey;
  temporal: TemporalKey;
  loreKey: string;
  entitiesPresent: EntityCard[];
  memoryOrchestrator: any;
  caches: { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> } | any;
}) {
  const caches = normalizeCaches(args.caches);
  // 1. Resolve Immutable Lore (z-) from local cache
  const loreEntry = caches.lore.get(args.loreKey) || null;

  // 2. Resolve Spacetime History (Stack) at this physical location
  const history = await args.memoryOrchestrator.lattice.expandTemporal({
    entry: { spatial: args.spatial, temporal: args.temporal },
    expansion: { mode: "plusMinusPages", n: CONFIG.TEMPORAL_WINDOW_PAGES || 3 }
  });

  // 3. Auto-resolve entities if not provided
  let entities = args.entitiesPresent;
  if (!entities || entities.length === 0) {
    entities = resolveEntitiesFromLocation(args.spatial, caches);
    if (entities.length > 0) {
      console.log(`[TurnEngine] Auto-resolved ${entities.length} entities at location:`, entities.map(e => e.name).join(', '));
    }
  }

  // 4. Resolve Immutable Entity Facts & Quest State via NPC Keys (z+)
  const activeQuests = entities.flatMap(ent => {
    const quests = caches.quests.get(ent.id) || [];
    const bio = caches.cast.get(ent.id) || null;
    return { entityId: ent.id, bio, quests };
  });

  if (activeQuests.length > 0) {
    console.log(`[TurnEngine] Injecting activeQuests:`, JSON.stringify(activeQuests.slice(0, 3)));
  }

  return { loreEntry, history: history.voxels, activeQuests };
}

export type TurnRequest = {
  playerText: string;
  spatial: SpatialKey;
  temporalBase: Omit<TemporalKey, "page">;
  page: number;
  loreKey: string;
  entitiesPresent?: EntityCard[];
  tagHints?: string[];
  entityHints?: string[];
  focusEntityId?: string;
  recipients?: TurnRecipient[];

  // Character metadata for narrative flavoring
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;

  // Persisted flags (quest progress, world toggles, etc.)
  flags?: Record<string, boolean | string | number>;

  // Optional debug tracing (server echoes timings when enabled)
  debug?: { enabled?: boolean; traceId?: string };
  // Caches populated during World Entry ingestion
  caches: { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> };
  llmConfig?: {
    model?: string;
    temperature?: number;
    embeddingModel?: string;
    minEmbeddings?: number;
    maxEmbeddings?: number;
    minTags?: number;
    maxTags?: number;
    enableTagLLM?: boolean;
    performanceMode?: boolean;
  };
};

// Define explicit types for quest updates to satisfy strict union checks
export type QuestStatus = 'ADVANCE' | 'FAIL' | 'FREEPLAY';
export type QuestUpdatePayload = {
  status: QuestStatus;
  message: string;
};

export type TurnResponse = {
  narration: string;
  outputs: Array<{ id: string; label: string; mode: RecipientMode; markdown: string }>;
  wroteVoxelId: string;
  usedMemory: Array<{ id: string; spatial: SpatialKey; temporal: TemporalKey }>;
  generatedNpcs?: GeneratedNpc[];      // Procedurally scaffolded NPCs from this turn
  generatedLandmarks?: GeneratedLandmark[];  // Procedurally scaffolded landmarks from this turn
  debug?: any;

  // --- NEW: Quest Update for Frontend ---
  questUpdates?: QuestUpdatePayload;
  newFlags?: Record<string, boolean | string | number>;
};

// Fallback "Nowhere" Constants
const NOWHERE_SPATIAL: SpatialKey = { g: 9, s: 9, o: 9, c: 0, ct: 0, r: 0 };
const NOWHERE_TEMPORAL_BASE: Omit<TemporalKey, "page"> = { saga: 999, book: 999, chapter: 999 };


function deriveTags(text: string): string[] {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "is", "are", "was", "were", "be", "been", "it", "that", "this", "as", "by", "we", "you", "i"
  ]);
  const toks = text
    .toLowerCase()
    .split(/[^a-z0-9_]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stop.has(t));
  const freq = new Map<string, number>();
  for (const t of toks) freq.set(t, (freq.get(t) ?? 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([t]) => t);
}

function clampRecipients(recipients?: TurnRecipient[]): TurnRecipient[] {
  if (!recipients || recipients.length === 0) return [{ id: "gm", label: "GM", mode: "gm" }];
  return recipients.slice(0, 5);
}

/**
 * 3-Part Quest Logic: Resolve flags based on currently present NPCs
 */
function resolveNewFlags(currentFlags: Record<string, any>, quest: any, entities: EntityCard[]): Record<string, any> | undefined {
  const worldId = quest.worldId || "G1-S1-O1";
  const questId = quest.questId || quest.id;
  const fPrefix = `q:${worldId}:${questId}`;
  const cast = quest.key_cast;
  if (!cast) return undefined;

  const currentIds = entities.map(e => e.id);
  const updates: Record<string, any> = {};

  // Phase 1: Giver
  if (cast.giver?.npc_key && currentIds.includes(cast.giver.npc_key) && !currentFlags[`${fPrefix}:giver_met`]) {
    updates[`${fPrefix}:giver_met`] = true;
  }
  // Phase 2: Intermediary (only if Giver met)
  if (currentFlags[`${fPrefix}:giver_met`] && cast.intermediary?.npc_key && currentIds.includes(cast.intermediary.npc_key) && !currentFlags[`${fPrefix}:intermediary_met`]) {
    updates[`${fPrefix}:intermediary_met`] = true;
  }
  // Phase 3: Closer (only if Intermediary met)
  if (currentFlags[`${fPrefix}:intermediary_met`] && cast.closer?.npc_key && currentIds.includes(cast.closer.npc_key) && !currentFlags[`${fPrefix}:closer_met`]) {
    updates[`${fPrefix}:closer_met`] = true;
    updates[`${fPrefix}:complete`] = true;
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}

export function createTurnEngine(args: { ollama: OllamaClient }) {
  const mem = createMemoryOrchestrator(args.ollama);
  const npcGen = createNpcGenerator(args.ollama);
  const landmarkGen = createLandmarkGenerator(args.ollama);



  async function processTurn(req: TurnRequest): Promise<TurnResponse> {
    if (!req.playerText?.trim()) throw new Error("playerText is required");

    const debugEnabled = !!req.debug?.enabled;
    const traceId = req.debug?.traceId || `tr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const t0 = Date.now();
    const marks: Record<string, number> = {};
    const mark = (name: string) => {
      if (!debugEnabled) return;
      marks[name] = Date.now();
    };
    const msBetween = (a: string, b: string) => {
      const aa = marks[a];
      const bb = marks[b];
      if (!aa || !bb) return undefined;
      return Math.max(0, bb - aa);
    };

    // Fallback: G9.S9.O9 (The Void)
    const spatial = req.spatial ?? NOWHERE_SPATIAL;

    // Fallback: Saga 999 (The Void History)
    const temporalBase = req.temporalBase ?? NOWHERE_TEMPORAL_BASE;

    // --- FIX: Query lattice for highest existing page at this location ---
    let startPage: number;
    if (Number.isFinite(req.page) && req.page > 0) {
      startPage = req.page;
    } else {
      try {
        const latest = await mem.lattice.latestAtLocation({
          spatial,
          scope: { saga: temporalBase.saga, book: temporalBase.book }
        });
        if (latest.voxels.length > 0 && latest.voxels[0].temporal) {
          startPage = latest.voxels[0].temporal.page + 1;
          console.log(`[TurnEngine] Found existing voxel. Continuing from page ${startPage}`);
        } else {
          startPage = 0;
        }
      } catch (err) {
        console.warn("[TurnEngine] Failed to query latest page, using timestamp:", err);
        startPage = Date.now();
      }
    }

    const loreKey = req.loreKey?.trim() ? req.loreKey : "void.general";
    const recipients = clampRecipients(req.recipients);
    const currentTemporal = { ...temporalBase, page: startPage };
    const caches = normalizeCaches(req.caches);

    mark("start");

    // 1. Determine & Retrieve relevant associative memories
    mark("memory.start");
    const memoryPieces = await mem.decideAndRetrieve({
      playerText: req.playerText,
      saga: temporalBase.saga,
      book: temporalBase.book,
      spatialHint: spatial,
      tagHints: req.tagHints,
      entityHints: req.entityHints,
      llmConfig: req.llmConfig
    });
    mark("memory.end");

    // 2. Resolve Deterministic Immutable Facts for this coordinate
    mark("deterministic.start");
    const deterministicContext = await resolveDeterministicContext({
      spatial: spatial,
      temporal: currentTemporal,
      loreKey: loreKey,
      entitiesPresent: req.entitiesPresent || [],
      memoryOrchestrator: mem,
      caches
    });
    mark("deterministic.end");

    // --- 2.5 THE DIRECTOR'S CUT (Logic Pass) ---
    let directorGuidance = "";
    let questUpdateData: QuestUpdatePayload | null = null;

    // Scan all unique quests in the local context to find active mission guidance
    const worldQuests = new Set<any>();
    for (const qEntry of deterministicContext.activeQuests) {
      if (Array.isArray(qEntry.quests)) {
        qEntry.quests.forEach((q: any) => worldQuests.add(q));
      }
    }

    const activeQuestList = Array.from(worldQuests);
    const activeQuest = activeQuestList[0]; // MVP: Focus on the first available quest in the sector

    if (activeQuest) {
      const worldId = activeQuest.worldId || "G1-S1-O1";
      const questId = activeQuest.questId || activeQuest.id;
      const fPrefix = `q:${worldId}:${questId}`;

      const giverMet = !!req.flags?.[`${fPrefix}:giver_met`];
      const intermediaryMet = !!req.flags?.[`${fPrefix}:intermediary_met`];
      const isComplete = !!req.flags?.[`${fPrefix}:complete`];

      const cast = activeQuest.key_cast;

      if (isComplete) {
        directorGuidance = `GM DIRECTIVE: Quest "${activeQuest.title}" is COMPLETED. The objective is cleared. Narrative focus shifts to secondary fallout or new rewards.`;
      } else if (!giverMet) {
        const tgt = cast?.giver?.name || "the quest giver";
        directorGuidance = `GM DIRECTIVE (PHASE 1 - INITIATION): Drive the player toward ${tgt} to begin the mission. Maintain atmospheric tension. NPCs should nudge the player toward this contact.`;
      } else if (!intermediaryMet) {
        const tgt = cast?.intermediary?.name || "the intermediary contact";
        directorGuidance = `GM DIRECTIVE (PHASE 2 - DEVELOPMENT): The Giver was met. Now "fill the space" between contacts. Guide the player toward ${tgt} to advance the mission. Focus on the journey and industrial obstacles.`;
      } else {
        const tgt = cast?.closer?.name || "the closer";
        directorGuidance = `GM DIRECTIVE (PHASE 3 - RESOLUTION): Nuance the quest to completion. Guide the player to ${tgt} for final hand-off or resolution.`;
      }
    }



    // 3. Build stateless prompt with deterministic injection
    mark("prompt.start");
    const { system, user, recipients: recSpec } = buildMultiRecipientPrompt({
      playerText: req.playerText,
      memories: memoryPieces as any,
      deterministicLore: deterministicContext.loreEntry,
      activeQuests: deterministicContext.activeQuests,
      questFlags: req.flags,
      recipients,
      playerClass: req.playerClass,
      playerAffinity: req.playerAffinity,
      characterDirectives: {
        ...req.characterDirectives,
        "DIRECTOR_GUIDANCE": directorGuidance // Inject the 3-part event system instructions
      }
    });
    mark("prompt.end");

    const narrativeModel = req.llmConfig?.model || CONFIG.LLM_MODEL;
    const narrativeTemp = req.llmConfig?.temperature ?? 0.7;
    mark("llm.main.start");
    const gen = await args.ollama.generate({
      model: narrativeModel,
      system,
      prompt: user,
      options: { temperature: narrativeTemp }
    });
    mark("llm.main.end");

    const raw = gen.response.trim();
    const outputs = parseLabeledSections(raw, recSpec ?? recipients);

    const narration =
      outputs.length === 0
        ? raw
        : outputs.map((o) => `=== ${o.label} ===\n${o.markdown}`.trim()).join("\n\n");

    const performanceMode = req.llmConfig?.performanceMode ?? false;

    // 4. Process narration for procedural NPC scaffolding
    const existingEntityNames = (req.entitiesPresent || []).map(e => e.name);
    npcGen.registerKnownEntities(existingEntityNames);

    const locationName = req.loreKey || `${spatial.g}-${spatial.s}-${spatial.o}`;
    mark("npcgen.start");
    const generatedNpcs = performanceMode
      ? []
      : await npcGen.processNarration(
        narration,
        {
          objectKey: locationName,
          spatial: spatial,
          locationName: locationName,
          locationType: "QUEST_LOCALE",
        },
        {
          factionHint: caches.lore.get(req.loreKey)?.faction,
          model: req.llmConfig?.model,
        }
      );
    mark("npcgen.end");

    const allEntities: EntityCard[] = [
      ...(req.entitiesPresent || []),
      ...generatedNpcs.map(npc => ({
        id: npc.entityRef.id,
        name: npc.entityRef.name,
        class: npc.entityRef.class,
        aliases: npc.entityRef.aliases,
      })),
    ];

    // Evaluate flag updates after LLM pass
    const newFlags = (activeQuest && !performanceMode)
      ? resolveNewFlags(req.flags || {}, activeQuest, allEntities)
      : undefined;

    if (newFlags) {
      console.log(`[TurnEngine] Flipping Quest Flags:`, JSON.stringify(newFlags));
      if (newFlags[`q:${activeQuest.worldId}:${activeQuest.questId || activeQuest.id}:complete`]) {
        questUpdateData = { status: 'ADVANCE', message: `Quest "${activeQuest.title}" Completed.` };
      }
    }

    // 5. Process narration for procedural landmark scaffolding
    mark("landmark.start");
    const generatedLandmarks = performanceMode
      ? []
      : await landmarkGen.processNarration(
        narration,
        {
          objectKey: locationName,
          spatial: spatial,
          locationName: locationName,
          locationType: "QUEST_LOCALE",
        },
        loreKey,
        { model: req.llmConfig?.model }
      );
    mark("landmark.end");

    // Build LoreContext for z- face (loreKey + procedural landmarks)
    const loreContext: LoreContext = {
      loreKey: loreKey,
      landmarks: generatedLandmarks.map(lm => ({
        id: lm.landmarkRef.id,
        name: lm.landmarkRef.name,
        type: lm.landmarkRef.type,
        description: lm.landmarkRef.description,
        tags: lm.landmarkRef.tags,
        isProcedural: lm.landmarkRef.isProcedural,
        parentLoreKey: lm.landmarkRef.parentLoreKey,
      })),
    };

    // 6. Record new memory voxel
    let voxel: any = null;
    let attempts = 0;

    const embModel = req.llmConfig?.embeddingModel || CONFIG.EMBED_MODEL;
    const minTags = req.llmConfig?.minTags ?? 1;
    const maxTags = req.llmConfig?.maxTags ?? 7;
    const minEmbeddings = req.llmConfig?.minEmbeddings ?? 1;
    const enableTagLLM = (req.llmConfig?.enableTagLLM ?? false) && !performanceMode;

    // A. Generate Tags (LLM optional)
    let tags: string[] = [];
    if (maxTags > 0) {
      mark("tags.start");
      tags = deriveTags(req.playerText); // Fallback
      if (enableTagLLM && req.llmConfig?.model) {
        try {
          const tagPrompt = `Analyze the following text and extract exactly ${maxTags} relevant conceptual tags (keywords). Return only the tags as a comma-separated list. text: "${req.playerText} ${narration}"`;
          const tagRes = await args.ollama.generate({
            model: req.llmConfig?.model || CONFIG.LLM_MODEL,
            prompt: tagPrompt,
            options: { temperature: 0.3 }
          });
          const extracted = tagRes.response.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 2);
          if (extracted.length >= minTags) {
            tags = extracted.slice(0, maxTags);
          }
        } catch (err) {
          console.warn("[TurnEngine] Tag Generation Failed, using fallback.", err);
        }
      }
      mark("tags.end");
    }

    // B. Generate Embeddings (Embedding Model)
    let embeddings: number[][] = [];
    if (!performanceMode && minEmbeddings > 0 && embModel && embModel !== 'none') {
      console.log(`[TurnEngine] Starting embedding generation (model: ${embModel}, min: ${minEmbeddings})`);
      try {
        mark("emb.start");
        const fullContext = `User: ${req.playerText}\nAI: ${narration}`;
        console.log(`[TurnEngine] Generating full context embedding...`);
        const mainEmb = await args.ollama.embeddings({ model: embModel, prompt: fullContext });
        if (mainEmb && mainEmb.embedding) {
          embeddings.push(mainEmb.embedding);
          console.log(`[TurnEngine] ✓ Full context embedding generated (length: ${mainEmb.embedding.length})`);
        } else {
          console.warn(`[TurnEngine] ✗ Full context embedding returned empty`);
        }

        if (minEmbeddings > 1) {
          console.log(`[TurnEngine] Generating user-specific embedding...`);
          const userEmb = await args.ollama.embeddings({ model: embModel, prompt: req.playerText });
          if (userEmb && userEmb.embedding) {
            embeddings.push(userEmb.embedding);
            console.log(`[TurnEngine] ✓ User embedding generated`);
          }
        }
        if (minEmbeddings > 2) {
          console.log(`[TurnEngine] Generating AI-specific embedding...`);
          const aiEmb = await args.ollama.embeddings({ model: embModel, prompt: narration });
          if (aiEmb && aiEmb.embedding) {
            embeddings.push(aiEmb.embedding);
            console.log(`[TurnEngine] ✓ AI embedding generated`);
          }
        }
        console.log(`[TurnEngine] Embedding generation complete. Total embeddings: ${embeddings.length}`);
        mark("emb.end");
      } catch (err) {
        console.warn("[TurnEngine] Embedding Generation Failed:", err);
      }
    } else {
      console.log("[TurnEngine] Embeddings disabled.");
    }

    mark("voxel.write.start");
    while (!voxel && attempts < 10) {
      try {
        voxel = await mem.lattice.upsertVoxel({
          spatial: spatial,
          temporal: currentTemporal,
          faces: {
            "x+": req.playerText,
            "x-": narration,
            "y+": embeddings,
            "y-": tags,
            "z+": allEntities,
            "z-": loreContext
          }
        });
      } catch (err: any) {
        const msg = (err.message || String(err)).toLowerCase();
        if (msg.includes('immutability') || msg.includes('voxel already exists')) {
          console.log(`[TurnEngine] Immutability Collision (Page ${currentTemporal.page}). Retrying with Page ${currentTemporal.page + 1}...`);
          currentTemporal.page += 1;
          attempts++;
        } else {
          console.log('[TurnEngine] Unexpected Voxel Error:', err);
          throw err;
        }
      }
    }
    mark("voxel.write.end");

    if (!voxel) throw new Error("Failed to write memory voxel: Collision limit exceeded.");

    return {
      narration,
      outputs,
      wroteVoxelId: voxel.id,
      usedMemory: memoryPieces.map((m: any) => ({ id: m.id, spatial: m.spatial, temporal: m.temporal })),
      generatedNpcs: generatedNpcs.length > 0 ? generatedNpcs : undefined,
      generatedLandmarks: generatedLandmarks.length > 0 ? generatedLandmarks : undefined,
      debug: debugEnabled
        ? {
          traceId,
          model: narrativeModel,
          temperature: narrativeTemp,
          performanceMode,
          embModel,
          recipients: (recSpec ?? recipients).map((r: any) => r.label ?? r.id),
          counts: {
            memories: Array.isArray(memoryPieces) ? memoryPieces.length : 0,
            entitiesPresent: (req.entitiesPresent || []).length,
            generatedNpcs: generatedNpcs.length,
            generatedLandmarks: generatedLandmarks.length,
            tags: tags.length,
            embeddings: embeddings.length,
          },
          ms: {
            total: Date.now() - t0,
            memory: msBetween("memory.start", "memory.end"),
            deterministic: msBetween("deterministic.start", "deterministic.end"),
            prompt: msBetween("prompt.start", "prompt.end"),
            llmMain: msBetween("llm.main.start", "llm.main.end"),
            npcGen: msBetween("npcgen.start", "npcgen.end"),
            landmark: msBetween("landmark.start", "landmark.end"),
            tags: msBetween("tags.start", "tags.end"),
            embeddings: msBetween("emb.start", "emb.end"),
            voxelWrite: msBetween("voxel.write.start", "voxel.write.end"),
          },
        }
        : undefined,
      questUpdates: questUpdateData || undefined,
      newFlags: newFlags || undefined
    };
  }

  return { processTurn, memory: mem, npcGenerator: npcGen, landmarkGenerator: landmarkGen };
}
