// packages/eideus-orchestrator-core/src/world/WorldService.ts
import { bindWorldBundle } from "eideus-world-bundle-binder";
import { resolveDominantAffinity } from "eideus-affinity-system";

export interface IngestResult {
    startKey: any;
    startLore: string;
    caches: {
        lore: Map<string, any>;
        cast: Map<string, any>;
        quests: Map<string, any>;
    };
}

export class WorldService {
    async ingestWorld(params: {
        playerAffinity: any;
        worldFiles: { lorebook: any; sectorMap: any; quests: any; sourceSeed: any };
    }): Promise<IngestResult> {
        console.log("[WorldService] Starting ingestion...");
        const bundle = bindWorldBundle(params.worldFiles);

        const playerBucket = resolveDominantAffinity(params.playerAffinity);
        const targetCiv = params.worldFiles.lorebook?.civilizations?.find(
            (c: any) => String(c.affinity || '').toLowerCase() === String(playerBucket?.dominant || 'str').toLowerCase()
        ) || params.worldFiles.lorebook?.civilizations?.[0];

        const startNode = bundle.nav_bindings.find(
            (nb: any) => nb.civIndex === targetCiv?.index && (nb.label.includes("City 1") || nb.label.includes("CT1"))
        ) || bundle.nav_bindings[0];

        // Populate Caches
        const worldCaches = {
            lore: new Map<string, any>(),
            cast: new Map<string, any>(),
            quests: new Map<string, any>()
        };

        bundle.nav_bindings.forEach((nb: any) => {
            worldCaches.lore.set(nb.loreKey, { label: nb.label, tags: nb.tags, kind: nb.nodeKind });
        });

        bundle.entity_index.forEach((ent: any) => {
            worldCaches.cast.set(ent.entityId, {
                name: ent.name,
                role: ent.role,
                title: ent.title,
                bio: ent.characterCard
            });
        });

        bundle.quest_bindings.forEach((qb: any) => {
            qb.npcIds.forEach((npcId: string) => {
                const existing = worldCaches.quests.get(npcId) || [];
                worldCaches.quests.set(npcId, [...existing, qb]);
            });
        });

        return {
            startKey: startNode?.spatialKey1 ?? startNode?.spatialKey0 ?? { g: 1, s: 1, o: 1, c: 1, ct: 1, r: 1 },
            startLore: startNode?.loreKey ?? "lore.default",
            caches: worldCaches
        };
    }
}
