// packages/eideus-ollama-orchestrator/src/resolver.ts
import type { SpatialKey, TemporalKey, EntityCard, LoreContext, LandmarkCard } from "eideus-memory-lattice-api";
import { CONFIG } from "./config.js";

function coerceMapLike(v: any): Map<string, any> {
    if (v instanceof Map) return v;
    if (v && typeof v === "object") return new Map<string, any>(Object.entries(v));
    return new Map<string, any>();
}

export function normalizeCaches(raw: any): { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> } {
    return {
        lore: coerceMapLike(raw?.lore),
        quests: coerceMapLike(raw?.quests),
        cast: coerceMapLike(raw?.cast),
    };
}

/**
 * Auto-resolve entities (NPCs) that should be at a given spatial location.
 */
export function resolveEntitiesFromLocation(
    spatial: SpatialKey,
    caches: { cast: Map<string, any>; quests: Map<string, any> }
): EntityCard[] {
    const entities: EntityCard[] = [];
    const spatialPattern = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c}-CT${spatial.ct}-R${spatial.r}`;

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
 * Resolves the deterministic world state for a turn.
 */
export async function resolveDeterministicContext(args: {
    spatial: SpatialKey;
    temporal: TemporalKey;
    loreKey: string;
    entitiesPresent: EntityCard[];
    memoryOrchestrator: any;
    caches: { lore: Map<string, any>; quests: Map<string, any>; cast: Map<string, any> };
}) {
    const caches = normalizeCaches(args.caches);
    const loreEntry = caches.lore.get(args.loreKey) || null;

    const history = await args.memoryOrchestrator.lattice.expandTemporal({
        entry: { spatial: args.spatial, temporal: args.temporal },
        expansion: { mode: "plusMinusPages", n: CONFIG.TEMPORAL_WINDOW_PAGES || 3 }
    });

    let entities = args.entitiesPresent;
    if (!entities || entities.length === 0) {
        entities = resolveEntitiesFromLocation(args.spatial, caches);
    }

    const activeQuests = entities.flatMap(ent => {
        const quests = caches.quests.get(ent.id) || [];
        const bio = caches.cast.get(ent.id) || null;
        return { entityId: ent.id, bio, quests };
    });

    return { loreEntry, history: history.voxels, activeQuests, entitiesResolved: entities };
}
