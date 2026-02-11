// Final_Dawn_of_Eideus/packages/eideus-ollama-orchestrator/src/turnEngine.ts
import { OllamaClient } from "./ollama/client";
import { CONFIG } from "./config.js";
import { createMemoryOrchestrator } from "./memoryOrchestrator.js";
import { createNpcGenerator, type GeneratedNpc, type EntityRef } from "./npc/index.js";
import { createLandmarkGenerator, type GeneratedLandmark, type LandmarkRef } from "./landmark/index.js";
import type { SpatialKey, TemporalKey, EntityCard, LoreContext, LandmarkCard } from "eideus-memory-lattice-api";
import { buildMultiRecipientPrompt, parseLabeledSections, TurnRecipient } from "./prompts.js";
import type { RecipientMode } from "./prompts";


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
  caches: { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> };
}) {
  // 1. Resolve Immutable Lore (z-) from local cache
  const loreEntry = args.caches.lore.get(args.loreKey) || null;

  // 2. Resolve Spacetime History (Stack) at this physical location
  const history = await args.memoryOrchestrator.lattice.expandTemporal({
    entry: { spatial: args.spatial, temporal: args.temporal },
    expansion: { mode: "plusMinusPages", n: CONFIG.TEMPORAL_WINDOW_PAGES || 3 }
  });

  // 3. Auto-resolve entities if not provided
  let entities = args.entitiesPresent;
  if (!entities || entities.length === 0) {
    entities = resolveEntitiesFromLocation(args.spatial, args.caches);
    if (entities.length > 0) {
      console.log(`[TurnEngine] Auto-resolved ${entities.length} entities at location:`, entities.map(e => e.name).join(', '));
    }
  }

  // 4. Resolve Immutable Entity Facts & Quest State via NPC Keys (z+)
  const activeQuests = entities.flatMap(ent => {
    const quests = args.caches.quests.get(ent.id) || [];
    const bio = args.caches.cast.get(ent.id) || null;
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
  // Caches populated during World Entry ingestion
  caches: { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> };
  llmConfig?: {
    model?: string;
    embeddingModel?: string;
    minEmbeddings?: number;
    maxEmbeddings?: number;
    minTags?: number;
    maxTags?: number;
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

  // --- NEW: Quest Update for Frontend ---
  questUpdates?: QuestUpdatePayload;
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
  if (!recipients || recipients.length === 0) return [{ id: "lyra", label: "LYRA", mode: "lyra" }];
  return recipients.slice(0, 3);
}

export function createTurnEngine(args: { ollama: OllamaClient }) {
  const mem = createMemoryOrchestrator(args.ollama);
  const npcGen = createNpcGenerator(args.ollama);
  const landmarkGen = createLandmarkGenerator(args.ollama);



  async function processTurn(req: TurnRequest): Promise<TurnResponse> {
    if (!req.playerText?.trim()) throw new Error("playerText is required");

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

    // 1. Determine & Retrieve relevant associative memories
    const memoryPieces = await mem.decideAndRetrieve({
      playerText: req.playerText,
      saga: temporalBase.saga,
      book: temporalBase.book,
      spatialHint: spatial,
      tagHints: req.tagHints,
      entityHints: req.entityHints,
      llmConfig: req.llmConfig
    });

    // 2. Resolve Deterministic Immutable Facts for this coordinate
    const deterministicContext = await resolveDeterministicContext({
      spatial: spatial,
      temporal: currentTemporal,
      loreKey: loreKey,
      entitiesPresent: req.entitiesPresent || [],
      memoryOrchestrator: mem,
      caches: req.caches
    });

    // --- 2.5 THE DIRECTOR'S CUT (Logic Pass) ---
    let directorGuidance = "";
    // Explicitly type this variable to match the TurnResponse interface
    let questUpdateData: QuestUpdatePayload | null = null;

    // For MVP, we just grab the first available quest step from the first entity
    const currentActiveQuest = deterministicContext.activeQuests[0]?.quests?.[0];

    // --- 2.5 THE DIRECTOR'S CUT (Logic Pass) ---
    // (Quest Adjudication Removed)
    let directorGuidance = "";
    // Explicitly type this variable to match the TurnResponse interface
    let questUpdateData: QuestUpdatePayload | null = null;

    // 3. Build stateless prompt with deterministic injection
    const { system, user, recipients: recSpec } = buildMultiRecipientPrompt({
      playerText: req.playerText,
      memories: memoryPieces as any,
      deterministicLore: deterministicContext.loreEntry,
      activeQuests: deterministicContext.activeQuests,
      recipients,
      playerClass: req.playerClass,
      playerAffinity: req.playerAffinity,
      characterDirectives: {
        ...req.characterDirectives,
        "GAME_LOGIC": directorGuidance // Inject the Director's instructions here
      }
    });

    const gen = await args.ollama.generate({
      model: CONFIG.LLM_MODEL,
      system,
      prompt: user,
      options: { temperature: 0.7 }
    });

    const raw = gen.response.trim();
    const outputs = parseLabeledSections(raw, recSpec ?? recipients);

    const narration =
      outputs.length === 0
        ? raw
        : outputs.map((o) => `=== ${o.label} ===\n${o.markdown}`.trim()).join("\n\n");

    // 4. Process narration for procedural NPC scaffolding
    const existingEntityNames = (req.entitiesPresent || []).map(e => e.name);
    npcGen.registerKnownEntities(existingEntityNames);

    const locationName = req.loreKey || `${spatial.g}-${spatial.s}-${spatial.o}`;
    const generatedNpcs = await npcGen.processNarration(
      narration,
      {
        objectKey: locationName,
        spatial: spatial,
        locationName: locationName,
        locationType: "QUEST_LOCALE",
      },
      {
        factionHint: req.caches.lore.get(req.loreKey)?.faction,
        model: req.llmConfig?.model,
      }
    );

    const allEntities: EntityCard[] = [
      ...(req.entitiesPresent || []),
      ...generatedNpcs.map(npc => ({
        id: npc.entityRef.id,
        name: npc.entityRef.name,
        class: npc.entityRef.class,
        aliases: npc.entityRef.aliases,
      })),
    ];

    // 5. Process narration for procedural landmark scaffolding
    const generatedLandmarks = await landmarkGen.processNarration(
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

    const embModel = req.llmConfig?.embeddingModel || "nomic-embed-text";
    const minTags = req.llmConfig?.minTags ?? 1;
    const maxTags = req.llmConfig?.maxTags ?? 7;
    const minEmbeddings = req.llmConfig?.minEmbeddings ?? 1;

    // A. Generate Tags (LLM)
    let tags: string[] = deriveTags(req.playerText); // Fallback
    if (req.llmConfig) {
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

    // B. Generate Embeddings (Embedding Model)
    let embeddings: number[][] = [];
    console.log(`[TurnEngine] Starting embedding generation (model: ${embModel}, min: ${minEmbeddings})`);
    try {
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
    } catch (err) {
      console.warn("[TurnEngine] Embedding Generation Failed:", err);
    }

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

    if (!voxel) throw new Error("Failed to write memory voxel: Collision limit exceeded.");

    return {
      narration,
      outputs,
      wroteVoxelId: voxel.id,
      usedMemory: memoryPieces.map((m: any) => ({ id: m.id, spatial: m.spatial, temporal: m.temporal })),
      generatedNpcs: generatedNpcs.length > 0 ? generatedNpcs : undefined,
      generatedLandmarks: generatedLandmarks.length > 0 ? generatedLandmarks : undefined,
      questUpdates: questUpdateData || undefined // Pass logic result back to frontend
    };
  }

  return { processTurn, memory: mem, npcGenerator: npcGen, landmarkGenerator: landmarkGen };
}