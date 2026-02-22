import { BinderOutputs, NavNodeBinding, EntityBinding, QuestBinding, BootstrapVoxel } from "./types.js";
import { parseExactSpatialFromId, parsePlaceTagFromId, mkLoreKey, uniq, manhattan } from "./parse.js";

type Inputs = { lorebook: any; sectorMap: any; quests: any; sourceSeed: any; acts?: any[] };

function getWorldId(lorebook: any): string {
  if (typeof lorebook?.world_id === "string") return lorebook.world_id;
  throw new Error("lorebook.json missing world_id");
}

function collectDistricts(lorebook: any) {
  const districts: Array<{
    civIndex: number;
    cityIndex: number;
    districtIndex: number;
    name: string;
    type: string;
    x: number;
    y: number;
    sampleEntityId: string;
    exact: ReturnType<typeof parseExactSpatialFromId> | null;
    placeTag: string | null;
    inhabitants: any[];
  }> = [];

  const civs = Array.isArray(lorebook?.civilizations) ? lorebook.civilizations : [];
  for (let civIndex = 0; civIndex < civs.length; civIndex++) {
    const civ = civs[civIndex];
    const cities = Array.isArray(civ?.cities) ? civ.cities : [];
    for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
      const city = cities[cityIndex];
      const districtsArr = Array.isArray(city?.districts) ? city.districts : [];
      for (let districtIndex = 0; districtIndex < districtsArr.length; districtIndex++) {
        const d = districtsArr[districtIndex];
        const x = d?.coordinates?.x;
        const y = d?.coordinates?.y;
        if (typeof x !== "number" || typeof y !== "number") continue;

        const inhabitants = Array.isArray(d?.inhabitants) ? d.inhabitants : [];
        const sampleEntityId = String(inhabitants?.[0]?.character_card?.id ?? "");
        if (!sampleEntityId) continue;

        districts.push({
          civIndex,
          cityIndex,
          districtIndex,
          name: String(d?.name ?? `district_${districtIndex}`),
          type: String(d?.type ?? "UNKNOWN"),
          x,
          y,
          sampleEntityId,
          exact: parseExactSpatialFromId(sampleEntityId),
          placeTag: parsePlaceTagFromId(sampleEntityId),
          inhabitants,
        });
      }
    }
  }
  return districts;
}

function nearestDistrict(districts: any[], civIndex: number, x: number, y: number) {
  const candidates = districts.filter((d) => d.civIndex === civIndex);
  if (candidates.length === 0) return null;
  let best = candidates[0];
  let bestD = manhattan(x, y, best.x, best.y);
  for (let i = 1; i < candidates.length; i++) {
    const d = candidates[i];
    const dist = manhattan(x, y, d.x, d.y);
    if (dist < bestD || (dist === bestD && String(d.name).localeCompare(String(best.name)) < 0)) {
      best = d;
      bestD = dist;
    }
  }
  return { district: best, distance: bestD };
}

function bindNavNodes(worldId: string, lorebook: any, sectorMap: any, warnings: string[]): NavNodeBinding[] {
  const districts = collectDistricts(lorebook);

  const nodesOut: NavNodeBinding[] = [];
  const civs = Array.isArray(sectorMap?.civilizations) ? sectorMap.civilizations : [];

  for (const civ of civs) {
    const civIndex = Number(civ?.index);
    const nodes = Array.isArray(civ?.nodes) ? civ.nodes : [];
    for (const n of nodes) {
      const nodeId = String(n?.id ?? "");
      const nodeKind = String(n?.kind ?? "");
      const x = Number(n?.x);
      const y = Number(n?.y);
      const label = String(n?.label ?? n?.name ?? nodeId);

      const exactMatches = districts.filter((d) => d.civIndex === civIndex && d.x === x && d.y === y);
      let d = exactMatches[0] ?? null;
      let bindMode = "exact";
      let dist = 0;

      if (!d) {
        const nearest = nearestDistrict(districts, civIndex, x, y);
        if (!nearest) {
          warnings.push(`No districts for civ=${civIndex}; node ${nodeId} cannot bind.`);
          nodesOut.push({
            worldId,
            civIndex,
            nodeId,
            nodeKind,
            cell: { civIndex, x, y },
            label,
            loreKey: `lore.${worldId}.unbound.${nodeId}`,
            spatialKey1: null,
            spatialKey0: null,
            placeTag: null,
            tags: uniq([`world:${worldId}`, `civ:${civIndex}`, `grid:c${civIndex}:x${x}:y${y}`, `node:${nodeId}`, `nodeKind:${nodeKind}`, "bound:none"]),
          });
          continue;
        }
        d = nearest.district;
        dist = nearest.distance;
        bindMode = "nearest";
        warnings.push(`Node ${nodeId} civ=${civIndex} at (${x},${y}) bound to nearest district '${d.name}' at (${d.x},${d.y}) d=${dist}.`);
      } else if (exactMatches.length > 1) {
        warnings.push(`Multiple districts match node ${nodeId} civ=${civIndex} at (${x},${y}); using first.`);
      }

      const k = d.exact?.k1 ?? null;
      const k0 = d.exact?.k0 ?? null;

      const loreKey = k ? mkLoreKey(worldId, k, d.name) : `lore.${worldId}.unkeyed.${nodeId}`;
      const tags = uniq([
        `world:${worldId}`,
        `civ:${civIndex}`,
        `grid:c${civIndex}:x${x}:y${y}`,
        `node:${nodeId}`,
        `nodeKind:${nodeKind}`,
        `district:${d.name}`,
        `districtType:${d.type}`,
        `bound:${bindMode}`,
        ...(bindMode === "nearest" ? [`boundDist:${dist}`] : []),
      ]);

      nodesOut.push({
        worldId,
        civIndex,
        nodeId,
        nodeKind,
        cell: { civIndex, x, y },
        label: d.name || label,
        loreKey,
        spatialKey1: k,
        spatialKey0: k0,
        placeTag: d.placeTag ?? null,
        tags,
      });
    }
  }
  return nodesOut;
}

function collectEntities(worldId: string, lorebook: any, navBindings: NavNodeBinding[], warnings: string[]): EntityBinding[] {
  const out: EntityBinding[] = [];
  const byCell = new Map<string, NavNodeBinding>();
  for (const nb of navBindings) byCell.set(`${nb.civIndex}:${nb.cell.x}:${nb.cell.y}`, nb);

  const addEntity = (name: string, role: any, title: any, card: any, fallbackLoreKey: string | null, tags: string[]) => {
    const id = String(card?.id ?? "");
    if (!id) return;

    const exact = parseExactSpatialFromId(id);
    const placeTag = parsePlaceTagFromId(id);

    out.push({
      worldId,
      entityId: id,
      name,
      role: role ?? null,
      title: title ?? null,
      spatialKey1: exact?.k1 ?? null,
      spatialKey0: exact?.k0 ?? null,
      placeTag,
      loreKey: fallbackLoreKey,
      tags: uniq([`world:${worldId}`, ...tags, `entity:${id}`]),
      characterCard: card,
    });
  };

  const civs = Array.isArray(lorebook?.civilizations) ? lorebook.civilizations : [];
  for (let civIndex = 0; civIndex < civs.length; civIndex++) {
    const civ = civs[civIndex];

    const leaderCard = civ?.leader?.character_card;
    if (leaderCard) {
      addEntity(
        String(civ?.leader?.name ?? "Leader"),
        civ?.leader?.role,
        civ?.leader?.title,
        leaderCard,
        leaderCard?.id ? `lore.${worldId}.C${civIndex + 1}.leader` : null,
        [`civ:${civIndex}`, "tier:leader"]
      );
    }

    const cities = Array.isArray(civ?.cities) ? civ.cities : [];
    for (let cityIndex = 0; cityIndex < cities.length; cityIndex++) {
      const city = cities[cityIndex];
      const govCard = city?.governor?.character_card;
      if (govCard) {
        addEntity(
          String(city?.governor?.name ?? "Governor"),
          city?.governor?.role,
          city?.governor?.title,
          govCard,
          govCard?.id ? `lore.${worldId}.C${civIndex + 1}.CT${cityIndex + 1}.governor` : null,
          [`civ:${civIndex}`, `city:${cityIndex}`, "tier:governor"]
        );
      }

      const districts = Array.isArray(city?.districts) ? city.districts : [];
      for (const d of districts) {
        const x = d?.coordinates?.x;
        const y = d?.coordinates?.y;
        const nb = typeof x === "number" && typeof y === "number" ? byCell.get(`${civIndex}:${x}:${y}`) : undefined;
        const loreKey = nb?.loreKey ?? null;

        const inhabitants = Array.isArray(d?.inhabitants) ? d.inhabitants : [];
        for (const h of inhabitants) {
          const card = h?.character_card;
          if (!card) continue;
          addEntity(
            String(h?.name ?? "NPC"),
            h?.role,
            h?.title,
            card,
            loreKey,
            [`civ:${civIndex}`, `grid:c${civIndex}:x${x}:y${y}`, nb ? `node:${nb.nodeId}` : "node:unbound", "tier:subordinate"]
          );
        }
      }
    }
  }

  const seen = new Set<string>();
  const dedup: EntityBinding[] = [];
  for (const e of out) {
    if (seen.has(e.entityId)) continue;
    seen.add(e.entityId);
    dedup.push(e);
  }
  if (dedup.length !== out.length) warnings.push(`Deduped entities: ${out.length - dedup.length}.`);
  return dedup;
}

function collectQuestBindings(worldId: string, quests: any, acts: any[], warnings: string[]): QuestBinding[] {
  const out: QuestBinding[] = [];
  const NPC_ID_RE = /G\d+-S\d+-O\d+-C\d+-CT\d+-R\d+-NPC/gi;

  // Helper to process a single quest object (from quests.json)
  const processQuest = (q: any, affinityPath?: string) => {
    const questId = String(q?.id ?? q?.quest_id ?? q?.title ?? "");
    if (!questId) return;

    // Extract NPC IDs from cast object (giver, contact, target)
    const npcIds: string[] = [];
    const cast = q?.cast;
    if (cast) {
      if (cast.giver?.id) npcIds.push(cast.giver.id);
      if (cast.contact?.id) npcIds.push(cast.contact.id);
      if (cast.target?.id) npcIds.push(cast.target.id);
    }

    // Fallback: scan entire quest JSON for NPC ID patterns
    if (npcIds.length === 0) {
      const blob = JSON.stringify(q);
      const matched = blob.match(NPC_ID_RE) ?? [];
      npcIds.push(...matched);
    }

    const uniqueNpcIds = uniq(npcIds);
    const spatialTargets1: any[] = [];
    const spatialTargets0: any[] = [];

    for (const id of uniqueNpcIds) {
      const parsed = parseExactSpatialFromId(id);
      if (parsed) {
        spatialTargets1.push(parsed.k1);
        spatialTargets0.push(parsed.k0);
      }
    }

    out.push({
      worldId,
      questId,
      title: q?.title ?? q?.name ?? null,
      npcIds: uniqueNpcIds,
      spatialTargets1,
      spatialTargets0,
      tags: uniq([
        `world:${worldId}`,
        `quest:${questId}`,
        ...(affinityPath ? [`affinity:${affinityPath}`] : []),
        ...uniqueNpcIds.map((x: string) => `entity:${x}`),
      ]),
    });
  };

  // Format 1: paths.STR/DEX/INT.campaign_outline.quests (campaign-based format)
  if (quests?.paths) {
    for (const [affinity, pathData] of Object.entries(quests.paths as Record<string, any>)) {
      const questsArr = pathData?.campaign_outline?.quests;
      if (Array.isArray(questsArr)) {
        for (const q of questsArr) {
          processQuest(q, affinity);
        }
      }
    }
  }

  // Format 2: quests[] array at root or quests.quests[]
  const flatQuestsArr = Array.isArray(quests?.quests) ? quests.quests : Array.isArray(quests) ? quests : [];
  for (const q of flatQuestsArr) {
    processQuest(q);
  }

  // Format 3: Act JSON files (act1-7.json) with paths[].chapters[] structure
  for (const actData of acts) {
    const actId = actData?.act?.id ?? "UNKNOWN_ACT";
    const actWorldId = actData?.act?.world_id ?? worldId;
    const paths = actData?.paths ?? [];

    for (const path of paths) {
      const attribute = path?.attribute ?? path?.id; // STR/DEX/INT
      const chapters = path?.chapters ?? [];

      for (const chapter of chapters) {
        const chapterNum = chapter?.chapter ?? 0;
        const title = chapter?.title ?? `Chapter ${chapterNum}`;
        const mission = chapter?.mission ?? "";
        const objectives = chapter?.objectives ?? [];
        const keyCast = chapter?.key_cast;

        // Extract NPC IDs from key_cast
        const npcIds: string[] = [];
        const keyCastData: any = {};

        if (keyCast?.giver?.npc_key) {
          npcIds.push(keyCast.giver.npc_key);
          keyCastData.giver = { name: keyCast.giver.name, npcKey: keyCast.giver.npc_key, role: keyCast.giver.role };
        }
        if (keyCast?.intermediary?.npc_key) {
          npcIds.push(keyCast.intermediary.npc_key);
          keyCastData.intermediary = { name: keyCast.intermediary.name, npcKey: keyCast.intermediary.npc_key, role: keyCast.intermediary.role };
        }
        if (keyCast?.closer?.npc_key) {
          npcIds.push(keyCast.closer.npc_key);
          keyCastData.closer = { name: keyCast.closer.name, npcKey: keyCast.closer.npc_key, role: keyCast.closer.role };
        }

        const uniqueNpcIds = uniq(npcIds);
        const spatialTargets1: any[] = [];
        const spatialTargets0: any[] = [];

        for (const id of uniqueNpcIds) {
          const parsed = parseExactSpatialFromId(id);
          if (parsed) {
            spatialTargets1.push(parsed.k1);
            spatialTargets0.push(parsed.k0);
          }
        }

        const questId = `${actId}_${attribute}_CH${chapterNum}`;

        out.push({
          worldId: actWorldId,
          questId,
          title,
          npcIds: uniqueNpcIds,
          spatialTargets1,
          spatialTargets0,
          tags: uniq([
            `world:${actWorldId}`,
            `act:${actId}`,
            `chapter:${chapterNum}`,
            `affinity:${attribute}`,
            `quest:${questId}`,
            ...uniqueNpcIds.map((x: string) => `entity:${x}`),
          ]),
          // Extended act fields
          actId,
          chapter: chapterNum,
          mission,
          objectives,
          attribute,
          keyCast: Object.keys(keyCastData).length > 0 ? keyCastData : undefined,
        });
      }
    }
  }

  if (out.length === 0) warnings.push("No quests found in quests.json or act files.");
  return out;
}

function buildBootstrapVoxels(
  worldId: string,
  navBindings: NavNodeBinding[],
  entities: EntityBinding[],
  warnings: string[]
): BootstrapVoxel[] {
  const out: BootstrapVoxel[] = [];
  let p = 0;

  const bySpatial = new Map<string, { loreKey: string; tags: string[]; label: string }>();
  for (const nb of navBindings) {
    if (!nb.spatialKey1 || !nb.spatialKey0) continue;
    const k = nb.spatialKey1;
    bySpatial.set(`${k.g}.${k.s}.${k.o}.${k.c}.${k.ct}.${k.r}`, { loreKey: nb.loreKey, tags: nb.tags, label: nb.label });
  }

  for (const [kStr, meta] of bySpatial.entries()) {
    const [g, s, o, c, ct, r] = kStr.split(".").map((n) => parseInt(n, 10));
    const spatialKey1 = { g, s, o, c, ct, r };
    const spatialKey0 = { g: g - 1, s: s - 1, o: o - 1, c: c - 1, ct: ct - 1, r: r - 1 };

    const zPlus = entities
      .filter((e) => e.spatialKey1 && e.spatialKey1.g === g && e.spatialKey1.s === s && e.spatialKey1.o === o && e.spatialKey1.c === c && e.spatialKey1.ct === ct && e.spatialKey1.r === r)
      .map((e) => e.characterCard ?? { id: e.entityId });

    out.push({
      spatialKey1,
      spatialKey0,
      temporalKey: { s: 0, b: 0, c: 0, p: p++ },
      faces: {
        "x+": "BOOTSTRAP",
        "x-": `BOOTSTRAP_LORE_ANCHOR:${meta.label}`,
        "y+": [],
        "y-": uniq([...meta.tags, `bootstrap:true`, `world:${worldId}`]),
        "z+": zPlus,
        "z-": meta.loreKey,
      },
    });
  }

  if (out.length === 0) warnings.push("Bootstrap voxels: 0 (no nav bindings with exact spatial keys).");
  return out;
}

export function bindWorldBundle(inputs: Inputs): BinderOutputs {
  const warnings: string[] = [];
  const worldId = getWorldId(inputs.lorebook);

  const nav_bindings = bindNavNodes(worldId, inputs.lorebook, inputs.sectorMap, warnings);
  const entity_index = collectEntities(worldId, inputs.lorebook, nav_bindings, warnings);
  const quest_bindings = collectQuestBindings(worldId, inputs.quests, inputs.acts ?? [], warnings);
  const bootstrap_voxels = buildBootstrapVoxels(worldId, nav_bindings, entity_index, warnings);

  return { worldId, generatedAtUnixMs: Date.now(), warnings, nav_bindings, entity_index, quest_bindings, bootstrap_voxels };
}
