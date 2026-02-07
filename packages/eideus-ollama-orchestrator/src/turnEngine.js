import { CONFIG } from "./config.js";
import { createMemoryOrchestrator } from "./memoryOrchestrator.js";
import { buildMultiRecipientPrompt, parseLabeledSections } from "./prompts.js";
/**
 * Deterministic Context Resolver
 * Injects only the specific data requested by the coordinate keys.
 */
async function resolveDeterministicContext(args) {
    // 1. Resolve Immutable Lore (z-) from local cache
    const loreEntry = args.caches.lore.get(args.loreKey) || null;
    // 2. Resolve Spacetime History (Stack) at this physical location
    const history = await args.memoryOrchestrator.lattice.expandTemporal({
        entry: { spatial: args.spatial, temporal: args.temporal },
        expansion: { mode: "plusMinusPages", n: CONFIG.TEMPORAL_WINDOW_PAGES || 3 }
    });
    // 3. Resolve Immutable Entity Facts & Quest State via NPC Keys (z+)
    const activeQuests = args.entitiesPresent.flatMap(ent => {
        const quests = args.caches.quests.get(ent.id) || [];
        const bio = args.caches.cast.get(ent.id) || null;
        return { entityId: ent.id, bio, quests };
    });
    return { loreEntry, history: history.voxels, activeQuests };
}
function deriveTags(text) {
    const stop = new Set([
        "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "is", "are", "was", "were", "be", "been", "it", "that", "this", "as", "by", "we", "you", "i"
    ]);
    const toks = text
        .toLowerCase()
        .split(/[^a-z0-9_]+/i)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3 && !stop.has(t));
    const freq = new Map();
    for (const t of toks)
        freq.set(t, (freq.get(t) ?? 0) + 1);
    return Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([t]) => t);
}
function clampRecipients(recipients) {
    if (!recipients || recipients.length === 0)
        return [{ id: "lyra", label: "LYRA", mode: "lyra" }];
    return recipients.slice(0, 3);
}
export function createTurnEngine(args) {
    const mem = createMemoryOrchestrator(args.ollama);
    async function processTurn(req) {
        if (!req.playerText?.trim())
            throw new Error("playerText is required");
        if (!req.spatial)
            throw new Error("spatial is required");
        if (!req.temporalBase)
            throw new Error("temporalBase is required");
        if (!Number.isFinite(req.page))
            throw new Error("page is required");
        if (!req.loreKey?.trim())
            throw new Error("loreKey is required");
        const recipients = clampRecipients(req.recipients);
        const currentTemporal = { ...req.temporalBase, page: req.page };
        // 1. Determine & Retrieve relevant associative memories
        const memoryPieces = await mem.decideAndRetrieve({
            playerText: req.playerText,
            saga: req.temporalBase.saga,
            book: req.temporalBase.book,
            spatialHint: req.spatial,
            tagHints: req.tagHints,
            entityHints: req.entityHints
        });
        // 2. Resolve Deterministic Immutable Facts for this coordinate
        const deterministicContext = await resolveDeterministicContext({
            spatial: req.spatial,
            temporal: currentTemporal,
            loreKey: req.loreKey,
            entitiesPresent: req.entitiesPresent || [],
            memoryOrchestrator: mem,
            caches: req.caches
        });
        // 3. Build stateless prompt with deterministic injection
        const { system, user, recipients: recSpec } = buildMultiRecipientPrompt({
            playerText: req.playerText,
            memories: memoryPieces,
            deterministicLore: deterministicContext.loreEntry,
            activeQuests: deterministicContext.activeQuests,
            recipients
        });
        const gen = await args.ollama.generate({
            model: CONFIG.LLM_MODEL,
            system,
            prompt: user,
            options: { temperature: 0.7 }
        });
        const raw = gen.response.trim();
        const outputs = parseLabeledSections(raw, recSpec ?? recipients);
        const narration = outputs.length === 0
            ? raw
            : outputs.map((o) => `=== ${o.label} ===\n${o.markdown}`.trim()).join("\n\n");
        const intentEmb = await mem.embedText(req.playerText);
        const outEmb = await mem.embedText(narration);
        // 4. Record new memory voxel (stacking at physical location)
        const voxel = await mem.lattice.upsertVoxel({
            spatial: req.spatial,
            temporal: currentTemporal,
            faces: {
                "x+": req.playerText,
                "x-": narration,
                "y+": [intentEmb, outEmb].slice(0, 7),
                "y-": deriveTags(req.playerText),
                "z+": req.entitiesPresent ?? [],
                "z-": req.loreKey
            }
        });
        return {
            narration,
            outputs,
            wroteVoxelId: voxel.id,
            usedMemory: memoryPieces.map((m) => ({ id: m.id, spatial: m.spatial, temporal: m.temporal }))
        };
    }
    return { processTurn, memory: mem };
}
