import { bindWorldBundle } from "../../eideus-world-bundle-binder/src/binder";
import { resolveDominantAffinity } from "../../eideus-affinity-system/src/affinity/llm";
import { parseSpatialKey } from "eideus-memory-lattice-api";
export class WorldLoader {
    /**
     * Performs deterministic world entry based on player affinity.
     */
    async ingestWorld(params) {
        // 1. Bind the world bundle to get indexed entities and nav nodes
        const bundle = bindWorldBundle(params.worldFiles);
        // 2. Determine Starting Location via Affinity
        // Logic: Find the first civilization whose affinity matches the player's dominant bucket
        const playerBucket = resolveDominantAffinity(params.playerAffinity);
        const targetCiv = params.worldFiles.lorebook.civilizations.find((c) => c.affinity?.toLowerCase() === playerBucket.dominant.toLowerCase()) || params.worldFiles.lorebook.civilizations[0];
        // Force start at City 1, Region 1 of that Civilization
        const startNode = bundle.nav_bindings.find((nb) => nb.civIndex === targetCiv.index && nb.label.includes("City 1")) || bundle.nav_bindings[0];
        // 3. Populate Stateless Caches
        const caches = {
            lore: new Map(),
            cast: new Map(),
            quests: new Map()
        };
        // Load 1 Civ, 3 Cities, 21 Regions into Lore Cache
        bundle.nav_bindings.forEach(nb => {
            caches.lore.set(nb.loreKey, { label: nb.label, tags: nb.tags, kind: nb.nodeKind });
        });
        // Load World Leaders, 3 Governors, 21 Subordinates into Cast Cache
        bundle.entity_index.forEach(ent => {
            caches.cast.set(ent.entityId, {
                name: ent.name,
                role: ent.role,
                title: ent.title,
                bio: ent.characterCard
            });
        });
        // Index Quests by NPC ID for instant lookup
        bundle.quest_bindings.forEach(q => {
            q.npcIds.forEach(npcId => {
                if (!caches.quests.has(npcId))
                    caches.quests.set(npcId, []);
                caches.quests.get(npcId).push({ title: q.title, id: q.questId, tags: q.tags });
            });
        });
        return {
            startKey: startNode.spatialKey1 ?? startNode.spatialKey0 ?? parseSpatialKey("g1.s1.o1.c1.ct1.r1"),
            startLore: startNode.loreKey,
            caches
        };
    }
}
