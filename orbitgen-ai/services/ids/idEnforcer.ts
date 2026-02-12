// PATH: services/ids/idEnforcer.ts
import { PlanetState } from '../../types';

export function ensureWorldPrefixedId(
  worldId: string, 
  rawId: string, 
  kind: "CIV"|"CITY"|"REG"|"LEAD"|"GOV"|"NPC"|"Q"
): string {
  if (!rawId) return `${worldId}-${kind}-${Math.random().toString(36).substr(2, 9)}`;
  if (rawId.startsWith(`${worldId}-`)) return rawId;
  return `${worldId}-${kind}-${rawId}`;
}

/**
 * Traverses the entire PlanetState and normalizes all IDs in place.
 * Returns the mutated state (or a copy if you prefer, currently mutating for performance/simplicity).
 */
export function normalizePlanetStateIds(worldId: string, state: PlanetState): PlanetState {
  if (!state.metadata || !state.metadata.civilizations) return state;

  // We need to track ID mappings to update references (e.g. cityId in region)
  const idMap: Record<string, string> = {};

  // 1. Civilizations
  state.metadata.civilizations.forEach((civ, civIdx) => {
    // Civ ID usually Gx-Sx-Ox-Cy, which implies worldId prefix. 
    // But we enforce it.
    const oldCivId = civ.civId;
    const newCivId = ensureWorldPrefixedId(worldId, oldCivId.replace(`${worldId}-`, ''), "CIV");
    civ.civId = newCivId;
    idMap[oldCivId] = newCivId;

    // Leader
    if (civ.leader) {
      civ.leader.id = ensureWorldPrefixedId(worldId, civ.leader.id.replace(`${worldId}-`, ''), "LEAD");
    }

    // Cities
    civ.cities.forEach(city => {
      const oldCityId = city.cityId;
      const newCityId = ensureWorldPrefixedId(worldId, oldCityId, "CITY");
      city.cityId = newCityId;
      city.civId = newCivId; // Update parent ref
      idMap[oldCityId] = newCityId;

      // Governor
      if (city.governor) {
        city.governor.id = ensureWorldPrefixedId(worldId, city.governor.id, "GOV");
        city.governor.cityId = newCityId;
        
        // Subordinates
        city.governor.lieutenants.forEach(sub => {
          const oldSubId = sub.id;
          const newSubId = ensureWorldPrefixedId(worldId, oldSubId, "NPC");
          sub.id = newSubId;
          sub.governorId = city.governor!.id;
          sub.cityId = newCityId;
          idMap[oldSubId] = newSubId;
        });
      }

      // Regions
      city.regionalLocales.forEach(region => {
        const oldRegionId = region.regionId;
        const newRegionId = ensureWorldPrefixedId(worldId, oldRegionId, "REG");
        region.regionId = newRegionId;
        region.cityId = newCityId;
        idMap[oldRegionId] = newRegionId;
      });
    });

    // Quests (Global to Civ)
    // We need to update npc references in quests
    if (civ.quests) {
      civ.quests.forEach(quest => {
        quest.id = ensureWorldPrefixedId(worldId, quest.id, "Q");
        
        // Update NPC refs if we mapped them
        if (idMap[quest.giverNpcId]) quest.giverNpcId = idMap[quest.giverNpcId];
        if (idMap[quest.middleNpcId]) quest.middleNpcId = idMap[quest.middleNpcId];
        if (idMap[quest.completionNpcId]) quest.completionNpcId = idMap[quest.completionNpcId];
      });

      // Also update quest references inside subordinates
      civ.cities.forEach(city => {
        city.governor?.lieutenants.forEach(sub => {
           if (sub.quests) {
             sub.quests.forEach(q => {
               // The quest object here is usually a reference or copy.
               // We should ensure ID is updated.
               q.id = ensureWorldPrefixedId(worldId, q.id, "Q");
               if (idMap[q.giverNpcId]) q.giverNpcId = idMap[q.giverNpcId];
               // ... others
             });
           }
        });
      });
    }
  });

  return state;
}
