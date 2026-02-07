import { CoordinateMapper } from "../../eideus-universe-mapper/dist/coordinateMapper.js";
import { bindWorldBundle } from "../../eideus-world-bundle-binder/dist/binder.js";
import { resolveDominantAffinity } from "../../eideus-affinity-system/dist/affinity/llm.js";
import { parseSpatialKey } from "eideus-memory-lattice-api";

export type IngestResult = {
  startKey: any;
  startLore: string;
  caches: {
    lore: Map<string, any>;
    cast: Map<string, any>;
    quests: Map<string, any>;
  };
};

export class WorldLoader {
  async ingestWorld(params: {
    playerAffinity: any;
    worldFiles: { lorebook: any; sectorMap: any; quests: any; sourceSeed: any };
  }): Promise<IngestResult> {
    console.log("[WorldLoader] Starting ingestion..."); // DEBUG
    console.time("bindWorldBundle");
    const bundle = bindWorldBundle(params.worldFiles);
    console.timeEnd("bindWorldBundle");

    // Logic: Find the first civilization whose affinity matches the player's dominant bucket
    console.log("[WorldLoader] Resolving affinity..."); // DEBUG
    const playerBucket = resolveDominantAffinity(params.playerAffinity);
    console.log("[WorldLoader] Affinity bucket:", playerBucket); // DEBUG

    const targetCiv = params.worldFiles.lorebook?.civilizations?.find(
      (c: any) => String(c.affinity || '').toLowerCase() === String(playerBucket?.dominant || 'str').toLowerCase()
    ) || params.worldFiles.lorebook?.civilizations?.[0];

    // Force start at City 1
    const startNode = bundle.nav_bindings.find(
      (nb) => nb.civIndex === targetCiv?.index && nb.label.includes("City 1")
    ) || bundle.nav_bindings[0];

    // Populate Stateless Caches
    const worldCaches = {
      lore: new Map<string, any>(),
      cast: new Map<string, any>(),
      quests: new Map<string, any>()
    };

    bundle.nav_bindings.forEach(nb => {
      worldCaches.lore.set(nb.loreKey, { label: nb.label, tags: nb.tags, kind: nb.nodeKind });
    });

    bundle.entity_index.forEach(ent => {
      worldCaches.cast.set(ent.entityId, {
        name: ent.name,
        role: ent.role,
        title: ent.title,
        bio: ent.characterCard
      });
    });

    bundle.quest_bindings.forEach(q => {
      q.npcIds.forEach(npcId => {
        if (!worldCaches.quests.has(npcId)) worldCaches.quests.set(npcId, []);
        worldCaches.quests.get(npcId).push({ title: q.title, id: q.questId, tags: q.tags });
      });
    });

    const defaultKey = parseSpatialKey("g1.s1.o1.c1.ct1.r1");

    return {
      startKey: startNode?.spatialKey1 ?? startNode?.spatialKey0 ?? defaultKey,
      startLore: startNode?.loreKey ?? "lore.default",
      caches: worldCaches
    };
  }
}
