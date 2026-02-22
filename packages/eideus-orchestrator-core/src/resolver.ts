import type { VoxelCoordinate, TemporalKey, EntityCard } from "./types.js";

export interface ResolverCaches {
    lore: Map<string, any>;
    quests: Map<string, any>;
    cast: Map<string, any>;
}

function coerceMapLike(v: any): Map<string, any> {
    if (v instanceof Map) return v;
    if (v && typeof v === "object") return new Map<string, any>(Object.entries(v));
    return new Map<string, any>();
}

export function normalizeCaches(raw: any): ResolverCaches {
    return {
        lore: coerceMapLike(raw?.lore),
        quests: coerceMapLike(raw?.quests),
        cast: coerceMapLike(raw?.cast),
    };
}

export function resolveEntitiesFromLocation(
    spatial: VoxelCoordinate,
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

export async function resolveDeterministicContext(args: {
    spatial: VoxelCoordinate;
    temporal: TemporalKey;
    loreKey: string;
    entitiesPresent?: EntityCard[];
    memoryOrchestrator: any; // eideus-memory-lattice-api client
    caches: any;
    temporalWindow?: number;
}) {
    const caches = normalizeCaches(args.caches);
    const loreEntry = caches.lore.get(args.loreKey) || null;

    const history = await args.memoryOrchestrator.lattice.expandTemporal({
        entry: { spatial: args.spatial, temporal: args.temporal },
        expansion: { mode: "plusMinusPages", n: args.temporalWindow || 3 }
    });

    let entities = args.entitiesPresent || [];
    if (entities.length === 0) {
        entities = resolveEntitiesFromLocation(args.spatial, caches);
    }

    const activeQuests = entities.flatMap(ent => {
        const quests = caches.quests.get(ent.id) || [];
        const bio = caches.cast.get(ent.id) || null;
        return { entityId: ent.id, bio, quests };
    });

    return { loreEntry, history: history.voxels, activeQuests, entitiesResolved: entities };
}
